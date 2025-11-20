import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const envStatus = {
    hasLiteAPIPrivateKey: !!import.meta.env.LITEAPI_PRIVATE_KEY,
    hasLiteAPIPublicKey: !!import.meta.env.LITEAPI_PUBLIC_KEY,
    liteAPIBaseUrl: import.meta.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0',
    nodeEnv: import.meta.env.NODE_ENV || 'development',
    // Show first 10 chars of keys for debugging (safe to expose)
    privateKeyPreview: import.meta.env.LITEAPI_PRIVATE_KEY 
      ? `${import.meta.env.LITEAPI_PRIVATE_KEY.substring(0, 10)}...` 
      : 'NOT SET',
    publicKeyPreview: import.meta.env.LITEAPI_PUBLIC_KEY 
      ? `${import.meta.env.LITEAPI_PUBLIC_KEY.substring(0, 10)}...` 
      : 'NOT SET',
  };

  return new Response(JSON.stringify(envStatus, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};







