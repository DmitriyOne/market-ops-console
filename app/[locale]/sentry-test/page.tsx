import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

import { SentryTestPage } from '@/pages/sentry-test';
import { env, routing } from '@/shared/config';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'sentryTest' });
  return { title: t('meta') };
}

// Only where ENABLE_SENTRY_TEST_PAGE is set (ADR 0019); elsewhere the usual
// 404. Read per request, so a build cannot freeze the answer.
export default async function Page() {
  await connection();
  if (!env.ENABLE_SENTRY_TEST_PAGE) notFound();
  // The layout leaves these texts out of every page; only this one gets them.
  const { sentryTest } = await getMessages();
  return (
    <NextIntlClientProvider messages={{ sentryTest }}>
      <SentryTestPage sentryOn={Boolean(env.NEXT_PUBLIC_SENTRY_DSN)} />
    </NextIntlClientProvider>
  );
}
