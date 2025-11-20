import type { APIRoute } from 'astro';

export const prerender = false;

const APPLE_CLIENT_ID = import.meta.env.APPLE_CLIENT_ID || '';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';

export const GET: APIRoute = async ({ url, redirect }) => {
  if (!APPLE_CLIENT_ID) {
    return new Response(
      JSON.stringify({ error: { message: 'Apple OAuth is not configured. Please use email sign-up instead.', code: 'OAUTH_NOT_CONFIGURED' } }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const redirectUri = `${SITE_URL}/api/auth/oauth/apple/callback`;
  const state = url.searchParams.get('state') || '/account';

  const authUrl = new URL('https://appleid.apple.com/auth/authorize');
  authUrl.searchParams.set('client_id', APPLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('response_mode', 'form_post');
  authUrl.searchParams.set('scope', 'email name');
  authUrl.searchParams.set('state', state);

  return redirect(authUrl.toString());
};

