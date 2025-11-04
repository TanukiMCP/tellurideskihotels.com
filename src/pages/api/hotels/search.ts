import type { APIRoute } from 'astro';
import { searchHotels } from '@/lib/liteapi/hotels';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const cityName = url.searchParams.get('cityName') || 'Telluride';
    const countryCode = url.searchParams.get('countryCode') || 'US';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    const result = await searchHotels({
      cityName,
      countryCode,
      limit,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Hotel search error:', error);
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

