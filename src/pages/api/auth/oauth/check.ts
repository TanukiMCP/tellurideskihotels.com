import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const clientId = import.meta.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET || '';
  const hasClientId = !!clientId;
  const hasClientSecret = !!clientSecret;
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';
  
  return new Response(
    JSON.stringify({
      configured: hasClientId && hasClientSecret,
      hasClientId,
      hasClientSecret,
      siteUrl,
      clientIdLength: clientId.length,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

