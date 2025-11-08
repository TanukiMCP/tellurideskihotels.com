/**
 * Viator Featured Activities API Endpoint
 * GET /api/viator/featured
 */

import type { APIRoute } from 'astro';
import { getFeaturedActivities } from '@/lib/viator/client';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '6');

    console.log('[API] Viator featured activities request:', { limit });

    const activities = await getFeaturedActivities(limit);

    return new Response(JSON.stringify({ activities }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('[API] Viator featured activities error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get featured activities',
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

