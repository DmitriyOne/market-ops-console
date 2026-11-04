'use client';

import { ChevronDownIcon, DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

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
  const view = useMemo(
    () => marketsTable(ds, scope, period, range, selected, sort),
    [ds, scope, period, range, selected, sort],
  );
  const sheetLabels = useSheetLabels();
  const [pending, setPending] = useState(false);

  // Any failure (ExcelJS chunk not loaded, workbook not written, download
  // refused) is logged and told; the dashboard stays as it is.
  // The trigger keeps focus (menu items wait instead): disabling it would drop focus.
  const save = async (action: 'export_xlsx' | 'export_csv', make: () => Promise<void> | void) => {
    if (pending) return;
    setPending(true);
    try {
      await make();
    } catch (error) {
      logError(error, { scope: 'ui', action });
      toast.error(t('failed'));
    } finally {
      setPending(false);
    }
  };

  const saveExcel = async () => {
    const months = marketsMonthly(ds, view, scope, period, range);
    const blob = await marketsXlsx(view, months, sheetLabels(window.location.href));
    downloadBlob(marketsXlsxName(period, range, scope.productId), blob);
  };

  const saveCsv = () => {
    downloadText(
      marketsCsvName(period, range, scope.productId),
      marketsCsv(view),
      'text/csv;charset=utf-8',
    );
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 gap-1"
          disabled={view.rows.length === 0}
          aria-busy={pending}
        >
          {pending ? (
            <LoaderCircleIcon aria-hidden className="motion-safe:animate-spin" />
          ) : (
            <DownloadIcon aria-hidden />
          )}
          {pending ? t('preparing') : t('button')}
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={15} className="min-w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('title')}
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="min-h-11 flex-col items-start gap-0"
          disabled={pending}
          onSelect={() => {
            void save('export_xlsx', saveExcel);
          }}
        >
          {t('excel')}
          <span className="text-xs text-muted-foreground">{t('excelHint')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11 flex-col items-start gap-0"
          disabled={pending}
          onSelect={() => {
            void save('export_csv', saveCsv);
          }}
        >
          {t('csv')}
          <span className="text-xs text-muted-foreground">{t('csvHint')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
