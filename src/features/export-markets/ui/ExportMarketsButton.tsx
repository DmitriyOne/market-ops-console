'use client';

import { DownloadIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { marketsTable, useDashboard } from '@/entities/performance';
import { downloadText } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { marketsCsv, marketsCsvName } from '../model/markets-csv';

/** Saves the markets table as shown (filter, sort, period, window) as CSV. */
export function ExportMarketsButton() {
  const t = useTranslations('exportMarkets');
  const { ds, state } = useDashboard();
  const { scope, period, range, selected, sort } = state;
  const view = marketsTable(ds, scope, period, range, selected, sort);
  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11"
      title={t('hint')}
      disabled={view.rows.length === 0}
      onClick={() => {
        downloadText(
          marketsCsvName(period, range, scope.productId),
          marketsCsv(view),
          'text/csv;charset=utf-8',
        );
      }}
    >
      <DownloadIcon aria-hidden />
      {t('button')}
    </Button>
  );
}
