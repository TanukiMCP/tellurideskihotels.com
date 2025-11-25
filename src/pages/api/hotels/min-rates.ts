import type { APIRoute } from 'astro';
import { getMinRates } from '@/lib/liteapi/rates';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  
  // Debug: Log all query parameters
  const allParams: Record<string, string | null> = {};
  url.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });
  console.log('[Min Rates API] Received query params:', allParams);
  console.log('[Min Rates API] Full URL:', request.url);
  
  // Try multiple case variations (some clients might send different casing)
  const hotelIdsParam = url.searchParams.get('hotelIds') || url.searchParams.get('hotelids') || url.searchParams.get('hotel_ids');
  const checkIn = url.searchParams.get('checkIn') || url.searchParams.get('checkin') || url.searchParams.get('check_in');
  const checkOut = url.searchParams.get('checkOut') || url.searchParams.get('checkout') || url.searchParams.get('check_out');
  const adults = parseInt(url.searchParams.get('adults') || '2');
  const currency = url.searchParams.get('currency') || 'USD';
  const guestNationality = url.searchParams.get('guestNationality') || 'US';
  const timeout = parseInt(url.searchParams.get('timeout') || '6');

  console.log('[Min Rates API] Parsed values:', {
    hotelIdsParam: hotelIdsParam ? `${hotelIdsParam.substring(0, 20)}...` : null,
    checkIn,
    checkOut,
    adults,
    hasHotelIds: !!hotelIdsParam,
    hasCheckIn: !!checkIn,
    hasCheckOut: !!checkOut,
  });

  if (!hotelIdsParam || !checkIn || !checkOut) {
    console.error('[Min Rates API] Missing required params:', {
      hotelIds: !!hotelIdsParam,
      checkIn: !!checkIn,
      checkOut: !!checkOut,
      allParams,
    });
    return new Response(
      JSON.stringify({ 
        error: 'hotelIds, checkIn, and checkOut are required',
        received: {
          hotelIds: !!hotelIdsParam,
          checkIn: !!checkIn,
          checkOut: !!checkOut,
        }
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const hotelIds = hotelIdsParam.split(',').map(id => id.trim()).filter(id => id !== '');
  
  console.log('[Min Rates API] Processed hotelIds:', hotelIds);

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

