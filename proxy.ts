import createMiddleware from 'next-intl/middleware';

// Imported directly: the i18n index pulls navigation → request config →
// next/root-params, which is not available in the proxy (middleware) runtime.
import { routing } from '@/shared/config/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
