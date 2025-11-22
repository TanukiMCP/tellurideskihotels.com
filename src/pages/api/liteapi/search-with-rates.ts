import type { APIRoute } from 'astro';
import { searchHotelsWithRates } from '@/lib/liteapi/rates';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  
  const cityName = url.searchParams.get('cityName') || 'Telluride';
  const countryCode = url.searchParams.get('countryCode') || 'US';
  const checkin = url.searchParams.get('checkin');
  const checkout = url.searchParams.get('checkout');
  const adults = parseInt(url.searchParams.get('adults') || '2');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  if (!checkin || !checkout) {
    return new Response(
      JSON.stringify({ 
        error: 'checkin and checkout dates are required',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const results = await searchHotelsWithRates({
      cityName,
      countryCode,
      checkIn: checkin,
      checkOut: checkout,
      adults,
      limit,
    });
    
    // Attach min prices to hotels
    const hotelsWithPrices = results.hotels.map(hotel => ({
      ...hotel,
      minPrice: results.minPrices[hotel.hotel_id] || null,
    }));
    
    // Limit results
    const limitedResults = {
      data: hotelsWithPrices.slice(0, limit),
      total: hotelsWithPrices.length,
    };
    
    return new Response(
      JSON.stringify(limitedResults),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800'
        }
      }
    );
  } catch (error) {
    console.error('Error searching hotels with rates:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to search hotels with rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

