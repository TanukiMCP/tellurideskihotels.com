import type { APIRoute } from 'astro';
import { confirmBooking } from '@/lib/liteapi/booking';

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

    const result = await confirmBooking(body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Booking confirmation error:', error);
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

