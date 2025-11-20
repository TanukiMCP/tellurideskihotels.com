import type { APIRoute } from 'astro';
import { findOrCreateOAuthUser } from '@/lib/auth';
import { SignJWT } from 'jose';

export const prerender = false;

const APPLE_CLIENT_ID = import.meta.env.APPLE_CLIENT_ID || '';
const APPLE_TEAM_ID = import.meta.env.APPLE_TEAM_ID || '';
const APPLE_KEY_ID = import.meta.env.APPLE_KEY_ID || '';
const APPLE_PRIVATE_KEY = import.meta.env.APPLE_PRIVATE_KEY || '';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';

interface AppleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
}

interface AppleIdToken {
  sub: string;
  email: string;
  email_verified: boolean | string;
}

async function createClientSecret(): Promise<string> {
  const privateKey = APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(privateKey, 'utf8'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: APPLE_KEY_ID })
    .setIssuer(APPLE_TEAM_ID)
    .setIssuedAt()
    .setExpirationTime('180d')
    .setAudience('https://appleid.apple.com')
    .setSubject(APPLE_CLIENT_ID)
    .sign(key);
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const code = formData.get('code') as string;
  const state = (formData.get('state') as string) || '/account';
  const user = formData.get('user'); // Apple sends user info on first auth only

  if (!code) {
    return redirect(`/account/login?error=no_code`);
  }

  try {
    const clientSecret = await createClientSecret();
    const redirectUri = `${SITE_URL}/api/auth/oauth/apple/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: APPLE_CLIENT_ID,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData: AppleTokenResponse = await tokenResponse.json();

    // Decode ID token (it's a JWT)
    const [, payloadBase64] = tokenData.id_token.split('.');
    const payload: AppleIdToken = JSON.parse(
      Buffer.from(payloadBase64, 'base64').toString('utf8')
    );

    if (!payload.email) {
      return redirect(`/account/login?error=no_email`);
    }

    // Parse user info if provided
    let userName = payload.email;
    if (user) {
      try {
        const userObj = JSON.parse(user as string);
        if (userObj.name) {
          userName = `${userObj.name.firstName || ''} ${userObj.name.lastName || ''}`.trim();
        }
      } catch {}
    }

    // Create or find user
    const { token } = await findOrCreateOAuthUser(
      payload.email,
      userName,
      'apple',
      payload.sub
    );

    // Set session cookie and redirect
    const response = redirect(state);
    response.headers.set(
      'Set-Cookie',
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error) {
    console.error('[Apple OAuth Callback] Error:', error);
    return redirect(`/account/login?error=oauth_failed`);
  }
};

