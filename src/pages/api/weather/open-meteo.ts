import type { APIRoute } from 'astro';
import { getWeather } from '@/lib/open-meteo/weather';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const weatherData = await getWeather(10);

    return new Response(JSON.stringify({ weatherData }), {
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

