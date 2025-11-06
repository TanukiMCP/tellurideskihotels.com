import type { APIRoute } from 'astro';
import { cancelBooking } from '@/lib/liteapi/booking';
import { getSessionFromRequest } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  // Verify admin session
  const session = await getSessionFromRequest(request);

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { bookingId } = params;

  if (!bookingId) {
    return new Response(
      JSON.stringify({ error: 'Booking ID required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await cancelBooking(bookingId);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[Admin Cancel Booking] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to cancel booking',
      }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

