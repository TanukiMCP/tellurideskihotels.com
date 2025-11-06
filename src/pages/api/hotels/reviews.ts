import type { APIRoute } from 'astro';
import { liteAPIClient } from '@/lib/liteapi/client';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    if (!hotelId) {
      return new Response(
        JSON.stringify({ error: 'hotelId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const params = new URLSearchParams({ hotelId });
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const reviews = await liteAPIClient<any>(`/data/reviews?${params.toString()}`, {
      method: 'GET',
    });

    return new Response(JSON.stringify(reviews), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[Hotel Reviews] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to fetch reviews',
        data: [],
      }),
      {
        status: error.status || 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

