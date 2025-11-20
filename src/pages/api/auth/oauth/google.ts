import type { APIRoute } from 'astro';

export const prerender = false;

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || '';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';

export const GET: APIRoute = async ({ url, redirect }) => {
  // Log for debugging (remove in production if needed)
  if (!GOOGLE_CLIENT_ID) {
    console.error('[Google OAuth] GOOGLE_CLIENT_ID is not set');
    return new Response(
      JSON.stringify({ error: { message: 'Google OAuth is not configured. Please use email sign-up instead.', code: 'OAUTH_NOT_CONFIGURED' } }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const redirectUri = `${SITE_URL}/api/auth/oauth/google/callback`;
  const state = url.searchParams.get('state') || '/account';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);

  return redirect(authUrl.toString());
};

