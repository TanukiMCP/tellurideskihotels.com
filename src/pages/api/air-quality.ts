/**
 * Air Quality API Route
 * Fetches current AQI data for Telluride from Open-Meteo Air Quality API
 */
import type { APIRoute } from 'astro';

const TELLURIDE_LAT = 37.9375;
const TELLURIDE_LON = -107.8123;

export const GET: APIRoute = async () => {
  try {
    const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    url.searchParams.set('latitude', TELLURIDE_LAT.toString());
    url.searchParams.set('longitude', TELLURIDE_LON.toString());
    url.searchParams.set('current', 'us_aqi,pm10,pm2_5');
    url.searchParams.set('timezone', 'America/Denver');

    console.log('[Air Quality API] Fetching from:', url.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Open-Meteo Air Quality API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Air Quality API] Received data:', data);

    return new Response(
      JSON.stringify({
        aqi: data.current?.us_aqi || null,
        pm10: data.current?.pm10 || null,
        pm2_5: data.current?.pm2_5 || null,
        timestamp: data.current?.time || new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error('[Air Quality API] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch air quality data',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

