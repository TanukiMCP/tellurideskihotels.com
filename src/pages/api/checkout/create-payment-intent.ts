import type { APIRoute } from 'astro';
import { createPaymentIntent } from '@/lib/stripe-server';
import { calculateNetAfterStripeFees } from '@/lib/utils';

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

    // Log business metrics
    const netAfterFees = calculateNetAfterStripeFees(amount);
    const stripeFee = amount - netAfterFees;
    
    console.log('[Payment Intent] Creating payment:', {
      customerPrice: amount,
      stripeFee: stripeFee.toFixed(2),
      netRevenue: netAfterFees.toFixed(2),
      currency,
      metadata,
    });

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
    console.error('[Payment Intent] Error:', error);
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

