import { connection } from 'next/server';

import { withErrorHandling } from '@/shared/api/server';
import { API_ROUTES, env } from '@/shared/config';

/**
 * The Sentry test page's API error (ADR 0019): throws on the server, so
 * `withErrorHandling` logs it and answers 500. Without
 * ENABLE_SENTRY_TEST_PAGE it is a bare 404, as if the route did not exist.
 * Read per request, so a build cannot freeze the answer.
 */
export const GET = withErrorHandling(API_ROUTES.sentryTest, async () => {
  await connection();
  if (!env.ENABLE_SENTRY_TEST_PAGE) return new Response(null, { status: 404 });
  throw new Error('Sentry test: API error');
});
