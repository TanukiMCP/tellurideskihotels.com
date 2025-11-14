import type { APIRoute } from 'astro';
import { prebook } from '@/lib/liteapi/booking';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.offerId) {
      return new Response(
        JSON.stringify({ error: 'offerId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await prebook({
      offerId: body.offerId,
      usePaymentSdk: true,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Prebook API] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to prebook' }),
      { status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

