export const LITEAPI_BASE_URL = import.meta.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0';
export const LITEAPI_BOOKING_BASE_URL = 'https://book.liteapi.travel/v3.0';
export const LITEAPI_PUBLIC_KEY = import.meta.env.LITEAPI_PUBLIC_KEY || '';
export const LITEAPI_PRIVATE_KEY = import.meta.env.LITEAPI_PRIVATE_KEY || '';

// Business margins - LiteAPI applies this margin and returns suggestedSellingPrice
// Industry standard: 10-20% for OTAs, we use 15%
export const LITEAPI_MARKUP_PERCENT = parseInt(import.meta.env.LITEAPI_MARKUP_PERCENT || '15', 10);

// Stripe fees: 2.9% + $0.30 per transaction
// We absorb these fees (included in our 15% margin)
export const STRIPE_PERCENTAGE_FEE = 0.029;
export const STRIPE_FIXED_FEE = 0.30;

