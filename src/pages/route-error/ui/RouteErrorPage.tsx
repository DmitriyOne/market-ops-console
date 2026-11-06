'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Link } from '@/shared/config';
import { logError } from '@/shared/lib';
import { Button, StatusScreen } from '@/shared/ui';

type Props = { error: Error & { digest?: string }; reset: () => void };

/** The 500 inside a locale (`app/[locale]/error.tsx`). */
export function RouteErrorPage({ error, reset }: Props) {
  const t = useTranslations();
  useEffect(() => {
    logError(error, { scope: 'ui', digest: error.digest });
  }, [error]);
  const appName = t('common.appName');
  const title = t('errorPage.title');
  return (
    <>
      <title>{t('common.titleTemplate', { page: title, appName })}</title>
      <StatusScreen
        code={500}
        appName={appName}
        skipLabel={t('common.skipToContent')}
        title={title}
        body={t('errorPage.body')}
        detail={
          error.digest ? (
            <p className="font-mono text-sm text-muted-foreground">
              {t('errorPage.errorId', { id: error.digest })}
            </p>
          ) : null
        }
      >
        <Button size="lg" className="h-11 px-5" onClick={reset}>
          {t('errors.retry')}
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 px-5">
          <Link href="/dashboard">{t('errorPage.home')}</Link>
        </Button>
      </StatusScreen>
    </>
  );
}
