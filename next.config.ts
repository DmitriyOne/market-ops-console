import { readFileSync } from 'node:fs';

import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { z } from 'zod';

import { API_ROUTES, CONTRACT_CHAT_ROUTE } from './src/shared/config/api-routes';
import { env } from './src/shared/config/env';

const withNextIntl = createNextIntlPlugin('./src/shared/config/i18n/request.ts');

const { name, version } = z
  .object({ name: z.string(), version: z.string() })
  .parse(JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')));

const nextConfig: NextConfig = {
  // The starter pack's contract names `POST /api/chat` (docs/CONTRACT.md); the
  // app serves it versioned (ADR 0012). The contract's path answers the same.
  rewrites: () => Promise.resolve([{ source: CONTRACT_CHAT_ROUTE, destination: API_ROUTES.chat }]),
};

// Sentry at build time (ADR 0019): every event names the release, browser
// events go through our own route, and source maps are uploaded (then
// deleted) only when a token is set; without one the build skips it quietly.
// A token without the organisation or project is a broken setup: stop.
const uploads = Boolean(env.SENTRY_AUTH_TOKEN);
if (uploads && (!env.SENTRY_ORG || !env.SENTRY_PROJECT)) {
  throw new Error('SENTRY_AUTH_TOKEN is set: SENTRY_ORG and SENTRY_PROJECT are required too.');
}

const config = withSentryConfig(withNextIntl(nextConfig), {
  org: env.SENTRY_ORG,
  project: env.SENTRY_PROJECT,
  authToken: env.SENTRY_AUTH_TOKEN,
  release: { name: `${name}@${version}`, create: uploads, finalize: uploads },
  sourcemaps: { disable: !uploads },
  widenClientFileUpload: true,
  // The closed test page is not listed in the route map shipped to browsers.
  routeManifestInjection: { exclude: [/sentry-test/] },
  // A neutral path (filter lists block "sentry"); Sentry rewrites it to
  // app/sentry-tunnel/route.ts (body only). proxy.ts's matcher skips both.
  tunnelRoute: '/monitoring',
  silent: !uploads,
  telemetry: false,
});

// withSentryConfig always turns on Next's experimental `clientTraceMetadata`
// (it links the browser's page-load trace to the server render). No
// experimental Next.js feature runs in production (CLAUDE.md, ADR 0018), so
// it is taken out: page-load and server traces arrive as two traces; errors
// and every other trace are unaffected (ADR 0019).
const experimental = { ...config.experimental };
delete experimental.clientTraceMetadata;

const finalConfig: NextConfig = { ...config, experimental };

export default finalConfig;
