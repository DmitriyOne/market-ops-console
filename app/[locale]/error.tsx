'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Link } from '@/shared/config';
import { logError } from '@/shared/lib';

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function ErrorPage({ error, reset }: Props) {
  const t = useTranslations();
  useEffect(() => {
    logError(error, { scope: 'ui', digest: error.digest });
  }, [error]);
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
