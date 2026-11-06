'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Link } from '@/shared/config';
import { logEvent } from '@/shared/lib';
import { Button, StatusScreen } from '@/shared/ui';

/** The 404 inside a locale: `notFound()` and unknown paths (the `[...rest]` route). */
export function NotFoundPage() {
  const t = useTranslations();
  const path = usePathname() ?? '';
  // A breadcrumb, not an issue: a mistyped or old address is normal (ADR 0019).
  useEffect(() => {
    logEvent('not_found', { path });
  }, [path]);
  const appName = t('common.appName');
  const title = t('notFound.title');
  return (
    <>
      <title>{t('common.titleTemplate', { page: title, appName })}</title>
      <StatusScreen
        code={404}
        appName={appName}
        skipLabel={t('common.skipToContent')}
        title={title}
        body={t('notFound.body')}
        detail={
          <p className="max-w-full rounded-md bg-muted px-2.5 py-1 font-mono text-sm break-all text-muted-foreground">
            {t.rich('notFound.address', {
              path,
              label: (chunks) => <span className="sr-only">{chunks}</span>,
            })}
          </p>
        }
      >
        <Button asChild size="lg" className="h-11 px-5">
          <Link href="/dashboard">{t('notFound.home')}</Link>
        </Button>
      </StatusScreen>
    </>
  );
}
