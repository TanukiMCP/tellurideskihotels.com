/**
 * Search All Telluride Experiences API Endpoint
 * Returns all experiences for Telluride with pagination support
 */

import type { APIRoute } from 'astro';
import { searchTellurideActivities } from '@/lib/viator/client';
import type { ViatorProductSummary } from '@/lib/viator/types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { start = 0, count = 100 } = body;

    // Fetch all Telluride experiences
    // Using a large count to get all experiences, then we'll paginate client-side
    const results = await searchTellurideActivities({
      pagination: {
        start: 0,
        count: 200, // Get up to 200 experiences
      },
      sorting: {
        sort: 'DEFAULT',
      },
    });

    const experiences = results.products || [];
    console.log('[API] Returning', experiences.length, 'experiences');
    console.log('[API] Sample product codes:', experiences.slice(0, 5).map(p => p.productCode));

    return new Response(
      JSON.stringify({
        success: true,
        experiences,
        totalCount: results.totalCount || 0,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('[API] Search all experiences error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to load experiences',
        },
        experiences: [],
        totalCount: 0,
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

