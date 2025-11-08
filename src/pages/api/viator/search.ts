/**
 * Viator Product Search API Endpoint
 * GET /api/viator/search
 */

import type { APIRoute } from 'astro';
import { searchTellurideActivities } from '@/lib/viator/client';
import type { ViatorSearchParams } from '@/lib/viator/types';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    
    // Build search parameters from query string
    const params: ViatorSearchParams = {
      searchTerm: searchParams.get('searchTerm') || undefined,
      tags: searchParams.get('tags') || undefined,
      sortOrder: (searchParams.get('sortOrder') as ViatorSearchParams['sortOrder']) || 'TOP_SELLERS',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      currencyCode: searchParams.get('currencyCode') || 'USD',
    };

    console.log('[API] Viator search request:', params);

    const results = await searchTellurideActivities(params);

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

