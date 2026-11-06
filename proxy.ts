import createMiddleware from 'next-intl/middleware';

// Imported directly: the i18n index pulls navigation → request config →
// next/root-params, which is not available in the proxy (middleware) runtime.
import { routing } from '@/shared/config/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals, files with an extension and
  // the preview images: `/en-GB/opengraph-image/…` is served as it is, not
  // redirected to the prefix-less default (0.13.0, ADR 0018).
  matcher: '/((?!api|_next|_vercel|.*opengraph-image|.*\\..*).*)',
};
