import type { APIRoute } from 'astro';
import { prebook } from '@/lib/liteapi/booking';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields (offerId is required by LiteAPI for prebook)
    if (!body.hotel_id || !body.rate_id || !body.checkin || !body.checkout || !body.adults) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: hotel_id, rate_id, checkin, checkout, and adults are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate offerId (required by LiteAPI, can be offerId or offer_id)
    if (!body.offerId && !body.offer_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: offerId is required for prebook' }),
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

