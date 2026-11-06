import { hasLocale } from 'next-intl';

import { type AppLocale, routing } from './routing';

/**
 * The locale an address names in its first segment; the default locale has
 * none (`localePrefix: 'as-needed'`). For pages that run without the i18n
 * provider (the global error page).
 */
export function localeFromPath(path: string | null): AppLocale {
  const first = path?.split('/')[1] ?? '';
  return hasLocale(routing.locales, first) ? first : routing.defaultLocale;
}

/** The dashboard's address in that locale, without the default's prefix. */
export function dashboardPath(locale: AppLocale): string {
  return locale === routing.defaultLocale ? '/dashboard' : `/${locale}/dashboard`;
}
