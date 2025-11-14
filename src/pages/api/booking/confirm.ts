import type { APIRoute } from 'astro';
import { confirmBooking } from '@/lib/liteapi/booking';
import { sendBookingConfirmation } from '@/lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.prebookId || !body.holder || !body.payment) {
      return new Response(
        JSON.stringify({ error: 'prebookId, holder, and payment are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await confirmBooking({
      prebookId: body.prebookId,
      holder: body.holder,
      payment: body.payment,
    });

    if (body.holder.email && body.hotelName && body.roomName) {
      sendBookingConfirmation({
        bookingId: result.bookingId,
        confirmationNumber: result.confirmationNumber,
        guestName: `${body.holder.firstName} ${body.holder.lastName}`,
        guestEmail: body.holder.email,
        hotelName: body.hotelName,
        checkIn: result.checkin,
        checkOut: result.checkout,
        roomName: body.roomName,
        adults: body.adults || 2,
        children: body.children || 0,
        totalPrice: result.total,
        currency: result.currency,
      }).catch(err => console.error('[Booking Confirm] Email failed:', err));
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Booking Confirm] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to confirm booking' }),
      { status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

