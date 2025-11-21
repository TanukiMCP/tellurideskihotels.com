/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly BETTER_AUTH_SECRET: string;
  readonly PUBLIC_SITE_URL: string;
  readonly RESEND_API_KEY: string;
  readonly FROM_EMAIL: string;
  readonly RESEND_FROM_EMAIL: string;
  readonly LITEAPI_KEY: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly TURSO_DATABASE_URL: string;
  readonly TURSO_AUTH_TOKEN: string;
  readonly AUTH_DB_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user?: import('./lib/auth').User;
    session?: {
      user: import('./lib/auth').User;
      session: {
        token: string;
        expiresAt: Date;
      };
    };
  }
}
