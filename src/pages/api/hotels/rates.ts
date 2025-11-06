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
    });

    const result = await searchRates({
      hotelIds: hotelId,
      checkIn,
      checkOut,
      adults,
      children,
    });

    console.log('[API /hotels/rates] Response:', {
      hasData: !!result.data,
      hotelCount: result.data?.length || 0,
      roomCount: result.data?.[0]?.rooms?.length || 0,
      sampleRoom: result.data?.[0]?.rooms?.[0],
    });

    return new Response(JSON.stringify(result), {
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

