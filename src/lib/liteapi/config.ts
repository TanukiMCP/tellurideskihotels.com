export const LITEAPI_BASE_URL = import.meta.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0';
export const LITEAPI_BOOKING_BASE_URL = 'https://book.liteapi.travel/v3.0';
export const LITEAPI_PUBLIC_KEY = import.meta.env.LITEAPI_PUBLIC_KEY || '';
export const LITEAPI_PRIVATE_KEY = import.meta.env.LITEAPI_PRIVATE_KEY || '';

// Log API key status on startup (only first 10 chars for security)
if (typeof process !== 'undefined') {
  console.log('[LiteAPI Config] API Key Status:', {
    hasPrivateKey: !!LITEAPI_PRIVATE_KEY,
    keyPreview: LITEAPI_PRIVATE_KEY ? `${LITEAPI_PRIVATE_KEY.substring(0, 10)}...` : 'NOT SET',
    baseUrl: LITEAPI_BASE_URL,
  });
}

// Your commission margin - LiteAPI applies this to calculate retailRate.total
// 
// HOW IT WORKS (per https://docs.liteapi.travel/docs/revenue-management-and-commission):
// - You set margin to 15%
// - LiteAPI calculates: retailRate.total = base rate + 15% commission + taxes
// - Example: Base $1,116 → Retail $1,283 (includes $167 commission)
// 
// WHAT CUSTOMER PAYS: retailRate.total ($1,283)
// YOUR COMMISSION: Already included in retailRate.total ($167 = 15% of base)
// WHEN YOU GET PAID: Weekly payouts on confirmed bookings (after checkout)
// 
// ⚠️ CRITICAL: AVOID DOUBLE MARKUP
// LiteAPI accounts have a default markup setting (user settings → Markup tab).
// The 'margin' parameter in API calls OVERRIDES the account default.
// 
// RECOMMENDED SETUP TO AVOID DOUBLE MARKUP:
// 1. Set your LiteAPI account default markup to 0% (user settings → Markup tab)
// 2. Use the margin parameter in code (set below) to control markup
// 3. This ensures only ONE markup is applied (the margin parameter)
// 
// ALTERNATIVE: Set margin to 0 here and use account default markup instead
// The margin parameter takes precedence over account default when provided
// 
// IMPORTANT: Do NOT add additional markup on top of retailRate.total
// The commission is already built into the price LiteAPI returns
// 
// Industry standard margin: 10-20% for OTAs
// Set to 0 for net rates (if you're merchant of record with separate fees)
// Set to match competitor pricing (e.g., 10-15% to match Booking.com)
export const LITEAPI_MARKUP_PERCENT = parseInt(import.meta.env.LITEAPI_MARKUP_PERCENT || '15', 10);

// Using liteAPI payment SDK - no payment processor fees!
// Customer pays retailRate.total, LiteAPI handles payment, you receive commission weekly

