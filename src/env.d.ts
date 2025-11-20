/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session?: {
      user: {
        id: string;
        email: string;
        name?: string;
      };
      session: {
        token: string;
        expiresAt: Date;
      };
    };
    user?: {
      id: string;
      email: string;
      name?: string;
    };
  }
}

interface ImportMetaEnv {
  readonly LITEAPI_BASE_URL: string;
  readonly LITEAPI_PUBLIC_KEY: string;
  readonly LITEAPI_PRIVATE_KEY: string;
  readonly LITEAPI_MARKUP_PERCENT: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PEXELS_API_KEY: string;
  readonly PUBLIC_MAPBOX_ACCESS_TOKEN: string;
  readonly VIATOR_API_KEY: string;
  readonly VIATOR_BASE_URL: string;
  readonly PUBLIC_PAYMENT_MODE: 'sandbox' | 'production';
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

