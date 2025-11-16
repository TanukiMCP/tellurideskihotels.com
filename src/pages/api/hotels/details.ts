import type { APIRoute } from 'astro';
import { getHotelDetails } from '@/lib/liteapi/hotels';
import { withCache } from '@/lib/cache';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');

    console.log('[Hotel Details API] Request received:', {
      url: request.url,
      searchParams: Array.from(url.searchParams.entries()),
      hotelId,
    });

    if (!hotelId) {
      return new Response(
        JSON.stringify({ 
          error: 'hotelId is required',
          debug: {
            url: request.url,
            searchParams: Array.from(url.searchParams.entries()),
          }
        }),
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

    console.log('[Hotel Details API] Returning hotel data:', {
      hotelId: hotel.hotel_id,
      name: hotel.name,
      roomsCount: hotel.rooms?.length || 0,
      imagesCount: hotel.images?.length || 0,
      hasRooms: !!hotel.rooms,
      roomsIsArray: Array.isArray(hotel.rooms),
      sampleRoom: hotel.rooms?.[0] ? {
        id: hotel.rooms[0].id,
        name: hotel.rooms[0].name,
        photosCount: hotel.rooms[0].photos?.length || 0,
        photosIsArray: Array.isArray(hotel.rooms[0].photos),
      } : null,
    });

    // Verify rooms are serializable before sending
    const serialized = JSON.stringify({ data: hotel });
    const parsed = JSON.parse(serialized);
    console.log('[Hotel Details API] After serialization check:', {
      roomsCount: parsed.data?.rooms?.length || 0,
      hasRooms: !!parsed.data?.rooms,
    });

    // Return data wrapped in { data: ... } for consistency with frontend expectations
    return new Response(serialized, {
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

