import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserBookings } from '@/lib/server/user-bookings';
import { liteAPIBookingClient } from '@/lib/liteapi/booking-client';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await getSessionFromRequest(request);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const records = await getUserBookings(session.user.id);

    if (records.length === 0) {
      return new Response(JSON.stringify({ bookings: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bookings = await Promise.all(
      records.map(async (record) => {
        try {
          const apiResponse = await liteAPIBookingClient<any>(`/bookings/${record.booking_id}`, {
            method: 'GET',
          });

          const raw = apiResponse.data;
          
          if (!raw) {
            console.warn('[Account Bookings API] No data in API response for booking', record.booking_id);
            throw new Error('No booking data returned');
          }

          return {
            bookingId: raw.bookingId || record.booking_id,
            status: raw.status || 'UNKNOWN',
            hotelName: raw.hotel?.name,
            checkIn: raw.checkin,
            checkOut: raw.checkout,
            roomName: raw.rooms?.[0]?.room_type || raw.rooms?.[0]?.roomType || 'Room',
            boardName: raw.rooms?.[0]?.boardName,
            currency: raw.rooms?.[0]?.currency || raw.currency,
            total: raw.rooms?.[0]?.amount || raw.total?.amount || raw.total,
            confirmationNumber: raw.hotelConfirmationCode,
            lastFreeCancellationDate: raw.lastFreeCancellationDate,
            guestEmail: record.guest_email,
            createdAt: record.created_at,
          };
        } catch (error) {
          console.error('[Account Bookings API] Failed to load booking', record.booking_id, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
          });
          return {
            bookingId: record.booking_id,
            status: 'UNAVAILABLE',
            hotelName: null,
            checkIn: null,
            checkOut: null,
            roomName: null,
            boardName: null,
            currency: null,
            total: null,
            confirmationNumber: null,
            lastFreeCancellationDate: null,
            guestEmail: record.guest_email,
            createdAt: record.created_at,
          };
        }
      })
    );

    return new Response(JSON.stringify({ bookings }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Account Bookings API] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to load bookings' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
