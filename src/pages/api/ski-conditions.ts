/**
 * Ski Conditions API Endpoint
 * GET /api/ski-conditions
 */

import type { APIRoute } from 'astro';
import { getTellurideSkiConditions } from '@/lib/snocountry/client';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    console.log('[API] Fetching ski conditions...');
    
    const conditions = await getTellurideSkiConditions();

    if (!conditions) {
      return new Response(
        JSON.stringify({ 
          error: 'Unable to fetch ski conditions',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(JSON.stringify(conditions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour, stale-while-revalidate for 2 hours
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('[API] Ski conditions error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch ski conditions',
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

