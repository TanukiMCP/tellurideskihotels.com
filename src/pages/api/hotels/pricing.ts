/**
 * API Endpoint: Hotel Pricing Data
 * 
 * Serves fallback/typical price ranges for hotels.
 * Used by client components to display prices when live rates are unavailable.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    const pricingPath = join(process.cwd(), 'src', 'data', 'hotel-price-ranges.json');
    const pricingContent = readFileSync(pricingPath, 'utf-8');
    const pricingData = JSON.parse(pricingContent);

    return new Response(JSON.stringify(pricingData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('[API] Error loading pricing data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load pricing data', hotels: {}, priceRangeCategories: {} }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

