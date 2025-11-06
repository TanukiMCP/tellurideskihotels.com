import type { APIRoute } from 'astro';
import { listBookings } from '@/lib/liteapi/booking';
import { getSessionFromRequest } from '@/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Verify admin session
  const session = await getSessionFromRequest(request);

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Fetch all bookings from LiteAPI
    const response = await listBookings();
    const bookings = response.data || [];

    return new Response(
      JSON.stringify({ bookings }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Admin Bookings] Error:', error);
    return new Response(
      JSON.stringify({ bookings: [] }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

