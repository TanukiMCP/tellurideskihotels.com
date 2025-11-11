import type { APIRoute } from 'astro';
import { searchHotels } from '@/lib/liteapi/hotels';
import { withCache } from '@/lib/cache';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const cityName = url.searchParams.get('cityName') || 'Telluride';
    const countryCode = url.searchParams.get('countryCode') || 'US';
    const limit = parseInt(url.searchParams.get('limit') || '500', 10);

    console.log('[API Hotels Search] Request:', { cityName, countryCode, limit });

    // Cache hotel search for 30 minutes (1800 seconds)
    // Hotel list doesn't change often, safe to cache
    const cacheKey = `hotel-search:${cityName}:${countryCode}:${limit}`;
    const result = await withCache(
      cacheKey,
      1800,
      () => searchHotels({
        cityName,
        countryCode,
        limit,
      })
    );

    console.log('[API Hotels Search] Response:', { 
      hotelsFound: result.data?.length || 0,
      sampleHotelId: result.data?.[0]?.hotel_id 
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
        'X-Cache-Status': 'HIT',
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

