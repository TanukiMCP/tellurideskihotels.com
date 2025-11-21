import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '@/lib/auth';
import { cancelBooking, amendGuestName } from '@/lib/liteapi/booking';
import { liteAPIBookingClient, LiteAPIBookingError } from '@/lib/liteapi/booking-client';
import { bookingBelongsToUser, recordBookingAccess } from '@/lib/server/booking-access';
import { getUserBookings } from '@/lib/server/user-bookings';

export const prerender = false;

async function loadBooking(bookingId: string) {
  const response = await liteAPIBookingClient<any>(`/bookings/${bookingId}`, { method: 'GET' });
  return response?.data?.data || response?.data || response;
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() || '';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSessionFromRequest(request);
    const body = await request.json();
    const action = String(body?.action || '').toLowerCase();
    const bookingId = String(body?.bookingId || '').trim();
    const email = normalize(body?.email);
    const lastName = normalize(body?.lastName);

    if (!bookingId || !action) {
      return new Response(
        JSON.stringify({ error: 'bookingId and action are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const booking = await loadBooking(bookingId);
    if (!booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const holderEmail = normalize(booking?.holder?.email);
    const holderLastName = normalize(booking?.holder?.lastName);

    if (session?.user?.id) {
      const [ownsBookingAccess, userBookings] = await Promise.all([
        bookingBelongsToUser(session.user.id, bookingId),
        getUserBookings(session.user.id),
      ]);
      const ownsBooking = ownsBookingAccess || userBookings.some((record) => record.booking_id === bookingId);
      if (!ownsBooking) {
        return new Response(
          JSON.stringify({ error: 'Booking not associated with account' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required for guest actions' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!holderEmail || holderEmail !== email) {
        return new Response(
          JSON.stringify({ error: 'Booking not found for provided email' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (lastName && holderLastName && holderLastName !== lastName) {
        return new Response(
          JSON.stringify({ error: 'Booking not found for provided guest info' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'cancel') {
      const cancelResult = await cancelBooking(bookingId);

      if (holderEmail) {
        await recordBookingAccess({
          bookingId,
          email: holderEmail,
          lastName: holderLastName,
          userId: session?.user?.id,
          userType: session?.user ? 'account' : 'guest',
        });
      }

      return new Response(JSON.stringify({ status: 'cancelled', data: cancelResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update-guest') {
      const newFirstName = String(body?.firstName || '').trim();
      const newLastName = String(body?.newLastName || body?.lastName || '').trim();

      if (!newFirstName || !newLastName) {
        return new Response(
          JSON.stringify({ error: 'firstName and newLastName are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const result = await amendGuestName(bookingId, newFirstName, newLastName);

      if (holderEmail) {
        await recordBookingAccess({
          bookingId,
          email: holderEmail,
          lastName: newLastName,
          userId: session?.user?.id,
          userType: session?.user ? 'account' : 'guest',
        });
      }

      return new Response(
        JSON.stringify({ status: 'updated', data: result }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    if (error instanceof LiteAPIBookingError) {
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('[Booking Manage API] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


