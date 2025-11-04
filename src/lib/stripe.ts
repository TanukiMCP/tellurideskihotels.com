export const STRIPE_PUBLISHABLE_KEY = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export async function loadStripe() {
  if (typeof window === 'undefined') return null;
  
  const { loadStripe: loadStripeLib } = await import('@stripe/stripe-js');
  return loadStripeLib(STRIPE_PUBLISHABLE_KEY);
}

