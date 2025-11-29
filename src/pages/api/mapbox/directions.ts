import type { APIRoute } from 'astro';

export const prerender = false;

interface DirectionsRequest {
  coordinates: Array<[number, number]>; // [lng, lat] pairs
  alternatives?: boolean;
  routeId?: string;
  profile?: 'driving' | 'walking' | 'cycling'; // Routing profile
}

interface DirectionsResponse {
  routes: Array<{
    id: string;
    distance: number; // meters
    duration: number; // seconds
    geometry: {
      type: 'LineString';
      coordinates: Array<[number, number]>;
    };
  }>;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    if (!MAPBOX_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Mapbox access token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: DirectionsRequest = await request.json();
    const { coordinates, alternatives = true, routeId, profile = 'driving' } = body;

    if (!coordinates || coordinates.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 coordinates required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate profile
    const validProfiles = ['driving', 'walking', 'cycling'];
    const routingProfile = validProfiles.includes(profile) ? profile : 'driving';

    // Build Mapbox Directions API URL
    // Format: /directions/v5/{profile}/{coordinates}?{parameters}
    const coordinatesString = coordinates
      .map(([lng, lat]) => `${lng},${lat}`)
      .join(';');

    const alternativesParam = alternatives ? 'true' : 'false';
    const url = `https://api.mapbox.com/directions/v5/mapbox/${routingProfile}/${coordinatesString}?alternatives=${alternativesParam}&geometries=geojson&steps=false&overview=full&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Mapbox Directions API] Error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch directions from Mapbox' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Transform Mapbox response to our format
    const routes: DirectionsResponse['routes'] = data.routes.map((route: any, index: number) => ({
      id: routeId ? `${routeId}-route-${index + 1}` : `route-${index + 1}`,
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
    }));

    return new Response(
      JSON.stringify({ routes }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error('[Mapbox Directions API Route] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

