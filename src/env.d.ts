/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly LITEAPI_BASE_URL: string;
  readonly LITEAPI_PUBLIC_KEY: string;
  readonly LITEAPI_PRIVATE_KEY: string;
  readonly LITEAPI_MARKUP_PERCENT: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PEXELS_API_KEY: string;
  readonly PUBLIC_MAPBOX_ACCESS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

