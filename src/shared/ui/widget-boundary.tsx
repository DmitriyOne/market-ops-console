'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { useErrorMessage } from '@/shared/api';

import { Button } from './button';
import { ErrorBoundary } from './error-boundary';

function WidgetError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useTranslations('errors');
  const message = useErrorMessage();
  return (
    <div role="alert" className="flex flex-col items-start gap-2 p-4">
      <p className="font-medium">{t('sectionTitle')}</p>
      <p className="text-sm text-muted-foreground">{message(error)}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t('retry')}
      </Button>
    </div>
  );
}

/**
 * Wrap each dashboard widget: one failing widget shows its own error and
 * Retry (which also re-runs failed queries) instead of breaking the page.
 */
export function WidgetBoundary({ children }: { children: ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={({ error, reset: retry }) => <WidgetError error={error} onRetry={retry} />}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
