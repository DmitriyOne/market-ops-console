import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { env } from '@/shared/config';

// The Sentry test page's server render error (ADR 0019): a Server Component
// that throws, reported by `onRequestError`, then the 500 page with the error
// ID. A 404 unless ENABLE_SENTRY_TEST_PAGE is set.
export default async function Page(): Promise<never> {
  await connection();
  if (!env.ENABLE_SENTRY_TEST_PAGE) notFound();
  throw new Error('Sentry test: server render error');
}
