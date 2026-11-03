import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en-GB', 'en-US', 'de-DE', 'ru-RU'],
  defaultLocale: 'en-GB',
  localePrefix: 'as-needed',
  localeCookie: { maxAge: 31536000 },
});

export type AppLocale = (typeof routing.locales)[number];
