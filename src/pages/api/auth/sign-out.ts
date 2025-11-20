import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async () => {
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  });

  return response;
};

