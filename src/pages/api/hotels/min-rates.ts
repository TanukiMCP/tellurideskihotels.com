import type { APIRoute } from 'astro';
import { getMinRates } from '@/lib/liteapi/rates';

// Ensure this API route is server-rendered, not prerendered
export const prerender = false;

// Helper to parse parameters from either URL query string or request body
async function parseParams(request: Request): Promise<{
  hotelIdsParam: string | null;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  currency: string;
  guestNationality: string;
  timeout: number;
  allParams: Record<string, string | null>;
}> {
  const url = new URL(request.url);
  
  // First try URL query parameters
  const allParams: Record<string, string | null> = {};
  url.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });
  
  // Try multiple case variations (some clients might send different casing)
  let hotelIdsParam = url.searchParams.get('hotelIds') || url.searchParams.get('hotelids') || url.searchParams.get('hotel_ids');
  let checkIn = url.searchParams.get('checkIn') || url.searchParams.get('checkin') || url.searchParams.get('check_in');
  let checkOut = url.searchParams.get('checkOut') || url.searchParams.get('checkout') || url.searchParams.get('check_out');
  let adults = parseInt(url.searchParams.get('adults') || '2');
  let currency = url.searchParams.get('currency') || 'USD';
  let guestNationality = url.searchParams.get('guestNationality') || 'US';
  let timeout = parseInt(url.searchParams.get('timeout') || '6');
  
  console.log('[Min Rates API] URL params:', { hotelIdsParam: !!hotelIdsParam, checkIn: !!checkIn, checkOut: !!checkOut });
  console.log('[Min Rates API] Full URL:', request.url);
  
  return { hotelIdsParam, checkIn, checkOut, adults, currency, guestNationality, timeout, allParams };
}

export const GET: APIRoute = async ({ request }) => {
  const { hotelIdsParam, checkIn, checkOut, adults, currency, guestNationality, timeout, allParams } = await parseParams(request);

  console.log('[Min Rates API GET] Parsed values:', {
    hotelIdsParam: hotelIdsParam ? `${hotelIdsParam.substring(0, 30)}...` : null,
    checkIn,
    checkOut,
    adults,
  });

  if (!hotelIdsParam || !checkIn || !checkOut) {
    console.error('[Min Rates API GET] Missing required params:', {
      hotelIds: !!hotelIdsParam,
      checkIn: !!checkIn,
      checkOut: !!checkOut,
      allParams,
      url: request.url,
    });
    return new Response(
      JSON.stringify({ 
        error: 'hotelIds, checkIn, and checkOut are required',
        received: {
          hotelIds: !!hotelIdsParam,
          checkIn: !!checkIn,
          checkOut: !!checkOut,
        },
        debug: {
          url: request.url,
          method: request.method,
        }
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const hotelIds = hotelIdsParam.split(',').map(id => id.trim()).filter(id => id !== '');
  
  console.log('[Min Rates API GET] Processed hotelIds:', hotelIds.length, 'hotels');

  if (hotelIds.length === 0) {
    return new Response(
      JSON.stringify({ 
        error: 'At least one hotelId is required',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const minRates = await getMinRates({
      hotelIds,
      checkIn,
      checkOut,
      adults,
      currency,
      guestNationality,
      timeout,
    });
    
    // Transform to array format for easier client-side consumption
    const data = Object.entries(minRates).map(([hotelId, rate]) => ({
      hotelId,
      price: rate.price,
      suggestedSellingPrice: rate.suggestedSellingPrice,
      currency: rate.currency,
    }));
    
    return new Response(
      JSON.stringify({ data }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes - rates change frequently
        }
      }
    );
  } catch (error) {
    console.error('Error fetching min rates:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch min rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

