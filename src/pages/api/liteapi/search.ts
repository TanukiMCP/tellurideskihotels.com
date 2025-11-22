import type { APIRoute } from 'astro';
import { searchHotels } from '@/lib/liteapi/hotels';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  
  const cityName = url.searchParams.get('cityName') || 'Telluride';
  const countryCode = url.searchParams.get('countryCode') || 'US';
  const checkin = url.searchParams.get('checkin');
  const checkout = url.searchParams.get('checkout');
  const adults = parseInt(url.searchParams.get('adults') || '2');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  try {
    const searchParams: any = {
      cityName,
      countryCode,
      adults,
    };

    if (checkin) searchParams.checkin = checkin;
    if (checkout) searchParams.checkout = checkout;

    const results = await searchHotels(searchParams);
    
    // Limit results
    const limitedResults = {
      ...results,
      data: results.data.slice(0, limit)
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
    console.error('Error searching hotels:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to search hotels',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

