import type { APIRoute } from 'astro';
import { getWeather } from '@/lib/open-meteo/weather';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get query parameters for date range
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Default to 10 days if no date range specified
    let days = 10;
    
    // Calculate days if both dates provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end
      days = Math.min(Math.max(diffDays, 1), 16); // Clamp between 1-16 days (Open-Meteo limit)
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

