import type { APIRoute } from 'astro';
import { signIn, createUser, AuthenticationError, requestEmailVerification } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    if (action === 'sign-in') {
      try {
        const result = await signIn(email, password);
        return new Response(
          JSON.stringify({ user: result.user }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': `auth_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
            },
          }
        );
      } catch (error: any) {
        if (error instanceof AuthenticationError) {
          return new Response(
            JSON.stringify({ error: { message: error.message, code: error.code } }),
            { status: error.status, headers: { 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }
    }

    if (action === 'sign-up') {
      try {
        await createUser(email, password, name);
        return new Response(
          JSON.stringify({
            success: true,
            verificationRequired: true,
            message: 'Account created. Check your email to verify before signing in.',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error: any) {
        if (error instanceof AuthenticationError) {
          return new Response(
            JSON.stringify({ error: { message: error.message, code: error.code } }),
            { status: error.status, headers: { 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }
    }

    if (action === 'resend-verification') {
      try {
        await requestEmailVerification(email);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error: any) {
        if (error instanceof AuthenticationError) {
          return new Response(
            JSON.stringify({ error: { message: error.message, code: error.code } }),
            { status: error.status, headers: { 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }
    }

    if (action === 'sign-out') {
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
          },
        }
      );
    }

    return new Response(JSON.stringify({ error: { message: 'Invalid action' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const message = error?.message || 'Authentication failed';
    return new Response(JSON.stringify({ error: { message } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

