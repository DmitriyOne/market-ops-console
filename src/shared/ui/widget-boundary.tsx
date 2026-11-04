'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { useErrorMessage } from '@/shared/api';

import { Button } from './button';
import { ErrorBoundary } from './error-boundary';

function WidgetError({
  error,
  onRetry,
  name,
}: {
  error: unknown;
  onRetry: () => void;
  name?: string;
}) {
  const t = useTranslations('errors');
  const message = useErrorMessage()(error);
  return (
    // A named widget sits among others that fail together on a data error;
    // the page announces that once, so the widget itself stays quiet.
    <div
      role={name ? undefined : 'alert'}
      className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4"
    >
      <p className="font-medium">{name ? t('widgetTitle', { name }) : t('sectionTitle')}</p>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button
        variant="outline"
        className="min-h-11"
        onClick={onRetry}
        aria-label={name ? t('retryWidget', { name }) : undefined}
      >
        {t('retry')}
      </Button>
    </div>
  );
}

/**
 * Wrap each dashboard widget: one failing widget shows its own error and
 * Retry (which also re-runs failed queries) instead of breaking the page.
 * `name` puts the widget in the message and the Retry button's name.
 */
export function WidgetBoundary({ children, name }: { children: ReactNode; name?: string }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={({ error, reset: retry }) => (
            <WidgetError error={error} onRetry={retry} name={name} />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
