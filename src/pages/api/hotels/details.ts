import type { APIRoute } from 'astro';
import { getHotelDetails } from '@/lib/liteapi/hotels';
import { withCache } from '@/lib/cache';

export const prerender = false;

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

    // Cache hotel details for 2 hours (7200 seconds)
    // Hotel info rarely changes, safe to cache aggressively
    // Use versioned cache key to ensure rooms are included (v2 includes rooms)
    const hotel = await withCache(
      `hotel-details-v2:${hotelId}`,
      7200,
      () => getHotelDetails(hotelId)
    );

    return new Response(JSON.stringify({ data: hotel }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
        'X-Cache-Status': 'HIT', // Indicate this is cacheable
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

