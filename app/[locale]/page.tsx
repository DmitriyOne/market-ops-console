import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';

import { redirect, routing } from '@/shared/config/i18n';

type Props = { params: Promise<{ locale: string }> };

export default async function LocaleIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  redirect({ href: '/dashboard', locale });
}
