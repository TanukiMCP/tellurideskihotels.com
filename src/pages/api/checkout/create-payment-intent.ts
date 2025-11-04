import type { APIRoute } from 'astro';
import { createPaymentIntent } from '@/lib/stripe-server';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { amount, currency = 'USD', metadata } = body;

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const paymentIntent = await createPaymentIntent(amount, currency, metadata);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Payment intent error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create payment intent',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

