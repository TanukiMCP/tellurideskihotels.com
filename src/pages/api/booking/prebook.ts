import type { APIRoute } from 'astro';
import { prebook } from '@/lib/liteapi/booking';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.hotel_id || !body.rate_id || !body.checkin || !body.checkout || !body.adults) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await prebook(body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Prebook error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to prebook',
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

