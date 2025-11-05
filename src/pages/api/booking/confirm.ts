import type { APIRoute } from 'astro';
import { confirmBooking } from '@/lib/liteapi/booking';
import { sendBookingConfirmation } from '@/lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.prebook_id) {
      return new Response(
        JSON.stringify({ error: 'prebook_id is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Booking Confirm] Confirming booking:', {
      prebookId: body.prebook_id,
      paymentMethod: body.payment?.method,
    });

    const result = await confirmBooking(body);

    console.log('[Booking Confirm] Booking confirmed:', {
      bookingId: result.booking_id,
      confirmationNumber: result.confirmation_number,
    });

    // Send confirmation email (non-blocking)
    if (body.guest_email && body.hotel_name && body.room_name) {
      sendBookingConfirmation({
        bookingId: result.booking_id,
        confirmationNumber: result.confirmation_number || result.booking_id,
        guestName: `${body.guest_first_name} ${body.guest_last_name}`,
        guestEmail: body.guest_email,
        hotelName: body.hotel_name,
        checkIn: body.checkin,
        checkOut: body.checkout,
        roomName: body.room_name,
        adults: body.adults || 2,
        children: body.children || 0,
        totalPrice: body.total_price || 0,
        currency: body.currency || 'USD',
      }).catch(err => {
        console.error('[Booking Confirm] Email send failed (non-blocking):', err);
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[Booking Confirm] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to confirm booking',
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

