import type { APIRoute } from 'astro';
import { getWeather } from '@/lib/open-meteo/weather';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get query parameters for date range
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Calculate how many days we need from TODAY to cover the requested range
    let days = 10;
    
    if (startDate && endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Calculate days from TODAY to END of trip
      const daysFromToday = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Open-Meteo free tier supports up to 16 days forecast
      days = Math.min(Math.max(daysFromToday, 1), 16);
      
      console.log('[Weather API] Calculated days needed:', {
        today: today.toISOString().split('T')[0],
        startDate,
        endDate,
        daysFromToday,
        requestingDays: days
      });
    }
    
    const weatherData = await getWeather(days);

    return new Response(JSON.stringify({ weatherData, startDate, endDate }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('[Open-Meteo API Route] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

