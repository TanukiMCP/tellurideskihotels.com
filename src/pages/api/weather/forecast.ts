import type { APIRoute } from 'astro';
import { getWeather } from '@/lib/liteapi/weather';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    // Parse URL from request object (more reliable in Astro hybrid mode)
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const latitude = url.searchParams.get('latitude');
    const longitude = url.searchParams.get('longitude');
    const units = url.searchParams.get('units') as 'metric' | 'imperial' | null;

    console.log('[Weather API Route] Request URL:', request.url);
    console.log('[Weather API Route] Parsed params:', {
      startDate,
      endDate,
      latitude,
      longitude,
      units,
    });

    if (!startDate || !endDate) {
      console.error('[Weather API Route] Missing required params');
      return new Response(
        JSON.stringify({ error: 'startDate and endDate are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const weatherData = await getWeather({
      startDate,
      endDate,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      units: units || 'imperial',
    });

    console.log('[Weather API Route] Success, returning data:', JSON.stringify(weatherData, null, 2));
    return new Response(JSON.stringify(weatherData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('[Weather API Route] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

