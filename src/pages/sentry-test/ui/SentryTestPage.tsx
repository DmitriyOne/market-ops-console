'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { fetchEmpty, HttpError } from '@/shared/api';
import { API_ROUTES, Link } from '@/shared/config';
import { logError, logWarning, traceSpan } from '@/shared/lib';
import { Button } from '@/shared/ui';

type Item =
  | 'clientError'
  | 'renderError'
  | 'handled'
  | 'rejection'
  | 'warning'
  | 'apiError'
  | 'serverError'
  | 'trace';

const ITEMS: readonly Item[] = [
  'clientError',
  'renderError',
  'handled',
  'rejection',
  'warning',
  'apiError',
  'serverError',
  'trace',
];

const TRACE_MS = 300;

/** Throws while rendering: the route's error page catches and logs it. */
function RenderBomb(): never {
  throw new Error('Sentry test: render error');
}

type Props = { sentryOn: boolean };

/**
 * Fires each kind of error on purpose, to see it arrive in Sentry (ADR 0019).
 * Reached only where ENABLE_SENTRY_TEST_PAGE is set (the route checks it).
 */
export function SentryTestPage({ sentryOn }: Props) {
  const t = useTranslations('sentryTest');
  const [result, setResult] = useState('');
  const [bomb, setBomb] = useState(false);

  const done = (item: Item) => {
    setResult(t('sent', { label: t(`items.${item}.label`), place: t(`items.${item}.place`) }));
  };

  const actions: Record<Exclude<Item, 'serverError'>, () => void> = {
    clientError: () => {
      throw new Error('Sentry test: client click error');
    },
    renderError: () => {
      setBomb(true);
    },
    handled: () => {
      logError(new Error('Sentry test: handled error'), { scope: 'ui', source: 'sentry-test' });
      done('handled');
    },
    rejection: () => {
      void Promise.reject(new Error('Sentry test: unhandled rejection'));
      done('rejection');
    },
    warning: () => {
      logWarning('sentry_test_warning', { scope: 'ui', source: 'sentry-test' });
      done('warning');
    },
    apiError: () => {
      fetchEmpty(API_ROUTES.sentryTest).then(
        () => {
          setResult(t('apiResult', { status: 200 }));
        },
        (error: unknown) => {
          setResult(t('apiResult', { status: error instanceof HttpError ? error.status : 0 }));
        },
      );
    },
    trace: () => {
      void traceSpan(
        'sentry-test.trace',
        'ui.test',
        () => new Promise<void>((resolve) => setTimeout(resolve, TRACE_MS)),
      ).then(() => {
        done('trace');
      });
    },
  };

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      {bomb ? <RenderBomb /> : null}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('intro')}</p>
        {sentryOn ? null : (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">{t('off')}</p>
        )}
      </header>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {ITEMS.map((item) => (
          <li key={item} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-medium">{t(`items.${item}.label`)}</span>
              <span className="text-sm text-muted-foreground">{t(`items.${item}.hint`)}</span>
            </div>
            {item === 'serverError' ? (
              <Button asChild variant="outline" className="min-h-11">
                <Link href="/sentry-test/server">{t(`items.${item}.label`)}</Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" className="min-h-11" onClick={actions[item]}>
                {t(`items.${item}.label`)}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p role="status" className="min-h-6 text-sm text-muted-foreground">
        {result}
      </p>
    </main>
  );
}
