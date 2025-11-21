import type { APIRoute } from 'astro';
import { findOrCreateOAuthUser } from '@/lib/auth';

export const prerender = false;

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = import.meta.env.GOOGLE_CLIENT_SECRET || '';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export const GET: APIRoute = async ({ url, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '/account';
  const error = url.searchParams.get('error');

  if (error) {
    console.error('[Google OAuth] Error:', error);
    return redirect(`/account/login?error=oauth_failed`);
  }

  if (!code) {
    return redirect(`/account/login?error=no_code`);
  }

  try {
    // Exchange code for access token
    const redirectUri = `${SITE_URL}/api/auth/oauth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json();

    if (!userInfo.email || !userInfo.email_verified) {
      return redirect(`/account/login?error=email_not_verified`);
    }

    // Create or find user
    const { token, isNewUser } = await findOrCreateOAuthUser(
      userInfo.email,
      userInfo.name || userInfo.email,
      'google',
      userInfo.sub,
      userInfo.picture
    );

    // Set session cookie and redirect
    // Add ?new=true for new users to show welcome message
    const redirectUrl = isNewUser ? `${state}?new=true` : state;
    const response = redirect(redirectUrl);
    response.headers.set(
      'Set-Cookie',
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error) {
    console.error('[Google OAuth Callback] Error:', error);
    return redirect(`/account/login?error=oauth_failed`);
  }
};

