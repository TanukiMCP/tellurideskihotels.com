import type { APIRoute } from 'astro';
import { getHotelDetails } from '@/lib/liteapi/hotels';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const hotelId = url.searchParams.get('hotelId');

  if (!hotelId) {
    return new Response(
      JSON.stringify({ error: 'Hotel ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const hotel = await getHotelDetails(hotelId);
    
    return new Response(
      JSON.stringify(hotel),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch hotel details',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

