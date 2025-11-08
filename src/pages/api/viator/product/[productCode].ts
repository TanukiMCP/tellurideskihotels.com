/**
 * Viator Product Details API Endpoint
 * GET /api/viator/product/{productCode}
 */

import type { APIRoute } from 'astro';
import { getProductDetails } from '@/lib/viator/client';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  try {
    const { productCode } = params;
    
    if (!productCode) {
      return new Response(
        JSON.stringify({ error: 'Product code is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const currencyCode = url.searchParams.get('currencyCode') || 'USD';

    console.log('[API] Viator product details request:', { productCode, currencyCode });

    const product = await getProductDetails(productCode, currencyCode);

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(JSON.stringify({ product }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('[API] Viator product details error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get product details',
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

