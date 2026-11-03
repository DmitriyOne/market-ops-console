import '@/app/styles/globals.css';

import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import { Providers } from '@/app/providers';
import { routing } from '@/shared/config/i18n';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
