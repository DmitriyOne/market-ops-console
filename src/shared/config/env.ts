import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const serverEnvSchema = {
  /** Delay between streamed tokens in the mock chat route, in ms. */
  MOCK_TOKEN_DELAY_MS: z.coerce.number().int().min(0).max(1000).default(35),
  /** Delay of every answer of the mock alerts route, in ms (spec §9): long enough to see "Saving…". */
  MOCK_ALERTS_DELAY_MS: z.coerce.number().int().min(0).max(5000).default(1200),
  /** Set by Vercel: the production domain, without the scheme (site-url.ts). */
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
  /** Opens the Sentry test page and its API (ADR 0019). Off unless set to true; set only in `.env.local`. */
  ENABLE_SENTRY_TEST_PAGE: z.stringbool().default(false),
  /** Uploads source maps to Sentry at build time; unset, the upload is skipped (next.config.ts). */
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  /** Sentry organisation and project slugs for the upload; required once the token is set (next.config.ts). */
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
};

export const env = createEnv({
  server: serverEnvSchema,
  shared: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.url().optional(),
    /** Sentry project key (public by design). Unset, Sentry stays off; E2E sets a fake local one (ADR 0019). */
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  },
  runtimeEnv: {
    MOCK_TOKEN_DELAY_MS: process.env.MOCK_TOKEN_DELAY_MS,
    MOCK_ALERTS_DELAY_MS: process.env.MOCK_ALERTS_DELAY_MS,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ENABLE_SENTRY_TEST_PAGE: process.env.ENABLE_SENTRY_TEST_PAGE,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  emptyStringAsUndefined: true,
});
