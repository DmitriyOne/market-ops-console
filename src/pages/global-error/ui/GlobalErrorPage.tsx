'use client';

import { createTranslator } from 'next-intl';

import type { AppLocale, enMessages } from '@/shared/config';
import { Button, StatusScreen } from '@/shared/ui';

type Props = {
  digest?: string;
  reset: () => void;
  locale: AppLocale;
  /** Passed in: the root layout and its i18n provider failed. */
  messages: typeof enMessages;
};

/** The 500 when the root layout itself fails (`app/global-error.tsx`). */
export function GlobalErrorPage({ digest, reset, locale, messages }: Props) {
  const t = createTranslator({ locale, messages });
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
          digest ? (
            <p className="font-mono text-sm text-muted-foreground">
              {t('errorPage.errorId', { id: digest })}
            </p>
          ) : null
        }
      >
        <Button size="lg" className="h-11 px-5" onClick={reset}>
          {t('errors.retry')}
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 px-5">
          {/* A plain link: next-intl's Link needs the provider that failed. */}
          <a href={`/${locale}/dashboard`}>{t('errorPage.home')}</a>
        </Button>
      </StatusScreen>
    </>
  );
}
