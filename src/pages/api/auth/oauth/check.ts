import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const hasClientId = !!import.meta.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!import.meta.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';
  
  return new Response(
    JSON.stringify({
      configured: hasClientId && hasClientSecret,
      hasClientId,
      hasClientSecret,
      siteUrl,
      clientIdLength: hasClientId ? import.meta.env.GOOGLE_CLIENT_ID.length : 0,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

