import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '@/lib/auth';
import { saveUserBooking } from '@/lib/server/user-bookings';
import { recordBookingAccess } from '@/lib/server/booking-access';
import { LiteAPIBookingError, processBookingConfirmation } from '@/lib/server/booking-confirm-service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body?.prebookId || !body?.holder || !body?.payment) {
      return new Response(
        JSON.stringify({ error: 'prebookId, holder, and payment are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await getSessionFromRequest(request);

    const result = await processBookingConfirmation(body);

    if (result?.bookingId && body?.holder?.email) {
      try {
        recordBookingAccess({
          bookingId: result.bookingId,
          email: body.holder.email,
          lastName: body.holder.lastName,
          userId: session?.user?.id,
          userType: session?.user?.id ? 'account' : 'guest',
        });
      } catch (error) {
        console.error('[Booking Confirm API] Failed to record booking access:', error);
      }
    }

    if (session?.user?.id && result?.bookingId) {
      try {
        saveUserBooking({
          userId: session.user.id,
          bookingId: result.bookingId,
          guestEmail: body.holder.email,
        });
      } catch (error) {
        console.error('[Booking Confirm API] Failed to save user booking:', error);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error instanceof LiteAPIBookingError) {
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('[Booking Confirm API] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to confirm booking' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

