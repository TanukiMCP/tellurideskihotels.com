import type { APIRoute } from 'astro';
import { verifyEmailToken, createSession, AuthenticationError } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const token = String(body?.token || '').trim();

    if (!token) {
      return new Response(JSON.stringify({ error: { message: 'token is required' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await verifyEmailToken(token);
    const sessionToken = await createSession(user);

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      return new Response(JSON.stringify({ error: { message: error.message, code: error.code } }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: { message: error?.message || 'Verification failed' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


