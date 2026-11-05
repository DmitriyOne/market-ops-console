import '@/app/styles/globals.css';

import { ThemeProvider } from '@wrksz/themes/next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import { fontVariables } from '@/app/fonts';
import { siteMetadata } from '@/app/metadata';
import { Providers } from '@/app/providers';
import { MODE_SCRIPT } from '@/features/switch-mode';
import { SECTION_SCRIPT } from '@/features/switch-section';
import { routing } from '@/shared/config';
import { PANEL_COLLAPSED_SCRIPT } from '@/widgets/app-shell';

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
      <head>
        {/* Applies the remembered collapsed assistant before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: PANEL_COLLAPSED_SCRIPT }} />
        {/* A phone link to the Assistant tab shows it from the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: SECTION_SCRIPT }} />
        {/* An Analyst link gets Analyst-shaped skeletons (no jump on hydration). */}
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body>
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
