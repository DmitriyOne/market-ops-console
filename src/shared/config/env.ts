import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const serverEnvSchema = {
  /** Delay between streamed tokens in the mock chat route, in ms. */
  MOCK_TOKEN_DELAY_MS: z.coerce.number().int().min(0).max(1000).default(35),
  /** Delay of every answer of the mock alerts route, in ms (spec §9): long enough to see "Saving…". */
  MOCK_ALERTS_DELAY_MS: z.coerce.number().int().min(0).max(5000).default(1200),
  /** Set by Vercel: the production domain, without the scheme (site-url.ts). */
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
};

export const env = createEnv({
  server: serverEnvSchema,
  client: {
    NEXT_PUBLIC_SITE_URL: z.url().optional(),
  },
  runtimeEnv: {
    MOCK_TOKEN_DELAY_MS: process.env.MOCK_TOKEN_DELAY_MS,
    MOCK_ALERTS_DELAY_MS: process.env.MOCK_ALERTS_DELAY_MS,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  emptyStringAsUndefined: true,
});
