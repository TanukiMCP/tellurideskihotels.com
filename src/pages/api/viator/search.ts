/**
 * Viator Product Search API Endpoint
 * GET /api/viator/search
 * Transforms query params to POST /products/search request
 */

import type { APIRoute } from 'astro';
import { searchTellurideActivities } from '@/lib/viator/client';
import type { ViatorSearchRequestBody } from '@/lib/viator/types';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    
    // Build search options from query string
    const text = searchParams.get('text') || searchParams.get('searchTerm') || undefined;
    const sortParam = searchParams.get('sort') || searchParams.get('sortOrder');
    const start = parseInt(searchParams.get('start') || '0');
    const count = parseInt(searchParams.get('count') || searchParams.get('pageSize') || '20');
    
    // Parse sorting
    let sorting: ViatorSearchRequestBody['sorting'] | undefined;
    if (sortParam) {
      if (sortParam === 'PRICE_LOW') {
        sorting = { sort: 'PRICE', order: 'ASCENDING' };
      } else if (sortParam === 'PRICE_HIGH') {
        sorting = { sort: 'PRICE', order: 'DESCENDING' };
      } else if (sortParam === 'RATING') {
        sorting = { sort: 'TRAVELER_RATING', order: 'DESCENDING' };
      } else if (['DEFAULT', 'TRAVELER_RATING', 'ITINERARY_DURATION', 'DATE_ADDED'].includes(sortParam)) {
        sorting = { sort: sortParam as any };
      }
    }

    console.log('[API] Viator search request:', { text, sorting, start, count });

    const results = await searchTellurideActivities({
      text,
      sorting,
      pagination: { start, count },
    });

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('[API] Viator search error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to search activities',
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

