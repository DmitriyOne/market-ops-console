'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config';

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function ErrorPage({ reset }: Props) {
  const t = useTranslations();
  return (
    <main id="main">
      <h1>{t('errorPage.title')}</h1>
      <p>{t('errorPage.body')}</p>
      <button type="button" onClick={reset}>
        {t('errors.retry')}
      </button>
      <Link href="/dashboard">{t('errorPage.home')}</Link>
    </main>
  );
}
