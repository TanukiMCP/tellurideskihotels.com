import type { APIRoute } from 'astro';
import { searchRates } from '@/lib/liteapi/rates';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');
    const checkIn = url.searchParams.get('checkIn');
    const checkOut = url.searchParams.get('checkOut');
    const adults = parseInt(url.searchParams.get('adults') || '2', 10);
    const children = parseInt(url.searchParams.get('children') || '0', 10);
    const rooms = parseInt(url.searchParams.get('rooms') || '1', 10);

    if (!hotelId || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ error: 'hotelId, checkIn, and checkOut are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API /hotels/rates] Request:', {
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
    });

    const result = await searchRates({
      hotelIds: hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
    });

    console.log('[API /hotels/rates] searchRates returned:', {
      hasData: !!result.data,
      dataLength: result.data?.length || 0,
      sampleHotel: result.data?.[0],
      sampleRooms: result.data?.[0]?.rooms,
    });

    // Transform to TheKeys.com format: flat array of rates
    const rates = result.data?.flatMap(hotel => 
      hotel.rooms?.flatMap(room => room.rates || []) || []
    ) || [];

    console.log('[API /hotels/rates] After transformation:', {
      totalRates: rates.length,
      sampleRate: rates[0],
    });

    return new Response(JSON.stringify({ rates }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Rate search error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to search rates',
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

