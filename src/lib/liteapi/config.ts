export const LITEAPI_BASE_URL = import.meta.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0';
export const LITEAPI_BOOKING_BASE_URL = 'https://book.liteapi.travel/v3.0';
export const LITEAPI_PUBLIC_KEY = import.meta.env.LITEAPI_PUBLIC_KEY || '';
export const LITEAPI_PRIVATE_KEY = import.meta.env.LITEAPI_PRIVATE_KEY || '';

// Your commission margin - LiteAPI applies this and calculates rates
// 
// HOW IT WORKS:
// - You set margin to 15%
// - LiteAPI returns TWO prices:
//   1. retailRate.total = Base rate + your 15% margin ($460 example)
//   2. retailRate.suggestedSellingPrice = Public SSP from hotel ($500 example)
// 
// WHAT WE DISPLAY: SSP ($500) for compliance with hotel rate parity agreements
// YOUR PROFIT: Difference between SSP and base hotel rate (varies by hotel/season)
// 
// Industry standard margin: 10-20% for OTAs
export const LITEAPI_MARKUP_PERCENT = parseInt(import.meta.env.LITEAPI_MARKUP_PERCENT || '15', 10);

// Using liteAPI payment SDK - no payment processor fees!
// Customer pays SSP, LiteAPI handles payment, you receive commission weekly

