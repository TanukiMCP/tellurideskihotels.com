import type { APIRoute } from 'astro';
import { getHotelDetails } from '@/lib/liteapi/hotels';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');

    if (!hotelId) {
      return new Response(
        JSON.stringify({ error: 'hotelId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const hotel = await getHotelDetails(hotelId);

    return new Response(JSON.stringify(hotel), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Hotel details error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to fetch hotel details',
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

