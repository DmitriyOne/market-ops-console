import '@/app/styles/globals.css';

import { ThemeProvider } from '@wrksz/themes/next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import { fontVariables } from '@/app/fonts';
import { siteMetadata } from '@/app/metadata';
import { BeforePaintScripts, Providers } from '@/app/providers';
import { routing } from '@/shared/config';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  return hasLocale(routing.locales, locale) ? siteMetadata(locale) : {};
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body>
        {/* Collapsed assistant, phone section and Analyst mode, marked on <html>
            before the first paint (ADR 0015); server HTML only, see the component. */}
        <BeforePaintScripts />
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>{children}</Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
