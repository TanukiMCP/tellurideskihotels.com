import type { APIRoute } from 'astro';
import { searchRatesStream } from '@/lib/liteapi/rates';
import type { LiteAPIRate } from '@/lib/liteapi/types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const { hotelIds, checkIn, checkOut, adults, children = 0, rooms = 1 } = body;

    if (!hotelIds || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ error: 'hotelIds, checkIn, and checkOut are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API /hotels/rates/stream] Starting stream:', {
      hotelIds: Array.isArray(hotelIds) ? hotelIds.length : hotelIds.split(',').length,
      checkIn,
      checkOut,
      adults,
    });

    // Create a ReadableStream to send SSE events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          await searchRatesStream(
            {
              hotelIds: Array.isArray(hotelIds) ? hotelIds.join(',') : hotelIds,
              checkIn,
              checkOut,
              adults: parseInt(adults?.toString() || '2', 10),
              children: parseInt(children?.toString() || '0', 10),
              rooms: parseInt(rooms?.toString() || '1', 10),
            },
            async (ratesChunk) => {
              // Flatten rates for frontend consumption
              const rates: LiteAPIRate[] = [];
              
              ratesChunk.forEach((hotel: any) => {
                if (hotel.rooms && Array.isArray(hotel.rooms)) {
                  hotel.rooms.forEach((room: any) => {
                    if (room.rates && Array.isArray(room.rates)) {
                      rates.push(...room.rates);
                    }
                  });
                }
              });

              if (rates.length > 0) {
                // Send SSE formatted chunk
                const data = JSON.stringify({ rates });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          );
          
          // Send completion marker
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[API /hotels/rates/stream] Error:', error);
          const errorData = JSON.stringify({
            error: error instanceof Error ? error.message : 'Stream failed',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[API /hotels/rates/stream] Request error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to start stream',
      }),
      {
        status: error.status || 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

