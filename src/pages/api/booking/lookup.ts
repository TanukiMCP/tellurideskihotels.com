import type { APIRoute } from 'astro';
import { liteAPIBookingClient, LiteAPIBookingError } from '@/lib/liteapi/booking-client';

export const prerender = false;

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<
  string,
  { count: number; expiresAt: number }
>();

function getClientKey(request: Request) {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for') ||
    headers.get('x-client-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('remote-addr') ||
    'unknown'
  );
}

function rateLimitExceeded(key: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (entry && entry.expiresAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return true;
    }
    entry.count += 1;
    return false;
  }

  rateLimitStore.set(key, {
    count: 1,
    expiresAt: now + RATE_LIMIT_WINDOW_MS,
  });
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  const clientKey = getClientKey(request);

  if (rateLimitExceeded(clientKey)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const bookingId = String(body?.bookingId || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const lastName = body?.lastName ? String(body.lastName).trim().toLowerCase() : null;

    if (!bookingId || !email) {
      return new Response(
        JSON.stringify({ error: 'bookingId and email are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiResponse = await liteAPIBookingClient<any>(`/bookings/${bookingId}`, {
      method: 'GET',
    });

    const raw = apiResponse?.data?.data || apiResponse?.data || apiResponse;
    const holderEmail = raw?.holder?.email?.toLowerCase();
    const holderLastName = raw?.holder?.lastName?.toLowerCase();

    if (!holderEmail || holderEmail !== email) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (lastName && holderLastName && holderLastName !== lastName) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const guests =
      raw?.bookedRooms?.flatMap((room: any) =>
        room?.guests?.map((guest: any) => ({
          firstName: guest?.firstName,
          lastName: guest?.lastName,
          email: guest?.email,
        }))
      ) || [];

    const responsePayload = {
      bookingId: raw?.bookingId || bookingId,
      confirmationNumber: raw?.hotelConfirmationCode,
      status: raw?.status,
      hotelName: raw?.hotel?.name,
      checkIn: raw?.checkin,
      checkOut: raw?.checkout,
      roomName: raw?.bookedRooms?.[0]?.roomType?.name,
      boardName: raw?.bookedRooms?.[0]?.boardName,
      total: raw?.price ?? raw?.bookedRooms?.[0]?.amount,
      currency: raw?.currency || raw?.bookedRooms?.[0]?.currency,
      cancellationPolicies: raw?.cancellationPolicies,
      lastFreeCancellationDate: raw?.lastFreeCancellationDate,
      guests,
      holderFirstName: raw?.holder?.firstName,
      holderLastName: raw?.holder?.lastName,
      holderEmail,
    };

    return new Response(JSON.stringify(responsePayload), {
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

    console.error('[Booking Lookup API] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to look up booking' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};

