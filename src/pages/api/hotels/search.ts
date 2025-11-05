import type { APIRoute } from 'astro';
import { searchHotels } from '@/lib/liteapi/hotels';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const cityName = url.searchParams.get('cityName') || 'Telluride';
    const countryCode = url.searchParams.get('countryCode') || 'US';
    const limit = parseInt(url.searchParams.get('limit') || '500', 10);

    console.log('[API Hotels Search] Request:', { cityName, countryCode, limit });

    const result = await searchHotels({
      cityName,
      countryCode,
      limit,
    });

    console.log('[API Hotels Search] Response:', { 
      hotelsFound: result.data?.length || 0,
      sampleHotelId: result.data?.[0]?.hotel_id 
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[API Hotels Search] Error:', {
      error: error.message || 'Failed to search hotels',
      stack: error.stack,
    });
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to search hotels',
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

