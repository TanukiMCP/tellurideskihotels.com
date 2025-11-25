import type { APIRoute } from 'astro';
import { getMinRates } from '@/lib/liteapi/rates';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  
  const hotelIdsParam = url.searchParams.get('hotelIds');
  const checkIn = url.searchParams.get('checkIn');
  const checkOut = url.searchParams.get('checkOut');
  const adults = parseInt(url.searchParams.get('adults') || '2');
  const currency = url.searchParams.get('currency') || 'USD';
  const guestNationality = url.searchParams.get('guestNationality') || 'US';
  const timeout = parseInt(url.searchParams.get('timeout') || '6');

  if (!hotelIdsParam || !checkIn || !checkOut) {
    return new Response(
      JSON.stringify({ error: 'hotelIds, checkIn, and checkOut are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const hotelIds = hotelIdsParam.split(',').map(id => id.trim()).filter(id => id !== '');

  if (hotelIds.length === 0) {
    return new Response(
      JSON.stringify({ error: 'At least one hotelId is required' }),
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
    
    // Transform to array format
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
          'Cache-Control': 'public, max-age=300'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch min rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
