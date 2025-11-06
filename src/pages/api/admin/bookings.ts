import type { APIRoute } from 'astro';
import { liteAPIClient } from '@/lib/liteapi/client';
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
    const response = await liteAPIClient<any>('/bookings', {
      method: 'GET',
    });

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

