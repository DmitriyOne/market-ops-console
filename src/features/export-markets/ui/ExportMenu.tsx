'use client';

import { ChevronDownIcon, DownloadIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { marketsMonthly, marketsTable, useDashboard } from '@/entities/performance';
import { downloadBlob, downloadText, logError } from '@/shared/lib';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  toast,
} from '@/shared/ui';

import { marketsCsv, marketsCsvName } from '../model/markets-csv';
import { marketsXlsx, marketsXlsxName } from '../model/markets-xlsx';
import { useSheetLabels } from './use-sheet-labels';

/**
 * Saves the markets table as shown (filter, sort, period, window): Excel
 * for people (formats, filters, months, words in the UI language), CSV for
 * tools (raw USD numbers, machine headers).
 */
export function ExportMenu() {
  const t = useTranslations('exportMarkets');
  const { ds, state } = useDashboard();
  const { scope, period, range, selected, sort } = state;
  const view = marketsTable(ds, scope, period, range, selected, sort);
  const sheetLabels = useSheetLabels();

  const saveExcel = async () => {
    try {
      const months = marketsMonthly(ds, view, scope, period, range);
      const blob = await marketsXlsx(view, months, sheetLabels(window.location.href));
      downloadBlob(marketsXlsxName(period, range, scope.productId), blob);
    } catch (error) {
      logError(error, { scope: 'ui', action: 'export_xlsx' });
      toast.error(t('failed'));
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 gap-1"
          disabled={view.rows.length === 0}
        >
          <DownloadIcon aria-hidden />
          {t('button')}
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={15} className="min-w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('title')}
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="min-h-11 flex-col items-start gap-0"
          onSelect={() => {
            void saveExcel();
          }}
        >
          {t('excel')}
          <span className="text-xs text-muted-foreground">{t('excelHint')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11 flex-col items-start gap-0"
          onSelect={() => {
            downloadText(
              marketsCsvName(period, range, scope.productId),
              marketsCsv(view),
              'text/csv;charset=utf-8',
            );
          }}
        >
          {t('csv')}
          <span className="text-xs text-muted-foreground">{t('csvHint')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
