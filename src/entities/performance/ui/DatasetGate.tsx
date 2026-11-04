'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { useErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui';

import { datasetQueryOptions } from '../api/dataset-query';

/**
 * Every dashboard widget reads the same dataset, so when it fails they would
 * all fail together. This shows that once, with one Retry, instead of one
 * alert per widget. While the data is loading, the widgets show their own
 * skeletons.
 */
export function DatasetGate({
  children,
  fallback,
}: {
  children: ReactNode;
  /** Shown instead of the message, for parts that must stay quiet (the page shows it once). */
  fallback?: ReactNode;
}) {
  const t = useTranslations('errors');
  const errorMessage = useErrorMessage();
  const { error, refetch, isFetching } = useQuery(datasetQueryOptions);

  if (!error) return children;
  if (fallback !== undefined) return fallback;
  const detail = errorMessage(error);
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4"
    >
      <p className="font-medium">{t('dataFailed')}</p>
      {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
      <Button
        variant="outline"
        className="min-h-11"
        disabled={isFetching}
        onClick={() => {
          void refetch();
        }}
      >
        {t('retry')}
      </Button>
    </div>
  );
}
