import type { APIRoute } from 'astro';
import { getWeather } from '@/lib/liteapi/weather';

export const GET: APIRoute = async ({ url }) => {
  try {
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const latitude = url.searchParams.get('latitude');
    const longitude = url.searchParams.get('longitude');
    const units = url.searchParams.get('units') as 'metric' | 'imperial' | null;

    if (!startDate || !endDate) {
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

    return new Response(JSON.stringify(weatherData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('[Weather API] Error fetching weather:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

