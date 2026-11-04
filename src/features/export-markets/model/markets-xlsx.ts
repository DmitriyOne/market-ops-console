import {
  type MarketsTableView,
  type Range,
  TABLE_COLUMNS,
  type TableColumn,
} from '@/entities/performance';
import type { MarketStatus, Period } from '@/shared/api';

import { marketsCsvName } from './markets-csv';

/** Words for the sheet in the UI language; numbers carry their own formats. */
export type MarketsSheetLabels = {
  sheet: string;
  /** First row: what the sheet shows (scope, window). */
  title: string;
  header: (column: TableColumn) => string;
  status: (status: MarketStatus) => string;
};

const MONEY = '"$"#,##0';
const SIGNED_MONEY = '+"$"#,##0;-"$"#,##0;"$"0';
const PERCENT = '0.0%';
const SIGNED_PERCENT = '+0.0%;-0.0%;0.0%';
const INTEGER = '#,##0';

// 8.8 → 0.088, not 0.08800000000000001 (what a spreadsheet would show in its formula bar).
const fraction = (n: number | null) => (n === null ? null : Math.round(n * 100) / 10_000);

/**
 * The markets table as shown, as an Excel workbook: real numbers with
 * money and percent formats (any regional setting reads them), a bold
 * frozen header with a filter, the market column frozen. ExcelJS loads
 * only when a file is made.
 */
export async function marketsXlsx(
  view: MarketsTableView,
  labels: MarketsSheetLabels,
): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet(labels.sheet, {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }],
  });
  sheet.columns = [
    { key: 'market', width: 18 },
    { key: 'region', width: 16 },
    { key: 'revenue', width: 14, style: { numFmt: MONEY } },
    { key: 'gap', width: 16, style: { numFmt: SIGNED_MONEY } },
    { key: 'attainment', width: 12, style: { numFmt: PERCENT } },
    { key: 'growth', width: 12, style: { numFmt: SIGNED_PERCENT } },
    { key: 'share', width: 10, style: { numFmt: PERCENT } },
    { key: 'units', width: 10, style: { numFmt: INTEGER } },
    { key: 'status', width: 12 },
  ];
  sheet.getCell('A1').value = labels.title;
  sheet.getCell('A1').font = { bold: true, size: 13 };
  const header = sheet.getRow(2);
  header.values = TABLE_COLUMNS.map(labels.header);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.border = { bottom: { style: 'thin' } };
  });
  for (const r of view.rows) {
    sheet.addRow([
      r.name,
      r.regionName,
      r.revenue.value === null ? null : Math.round(r.revenue.value),
      r.gap.value === null ? null : Math.round(r.gap.value),
      fraction(r.attainmentPct.value),
      fraction(r.growthPct.value),
      fraction(r.sharePct.value),
      r.units.value,
      r.status ? labels.status(r.status) : null,
    ]);
  }
  sheet.autoFilter = 'A2:I2';
  const buffer = await book.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function marketsXlsxName(period: Period, range: Range, productId?: string): string {
  return marketsCsvName(period, range, productId).replace(/\.csv$/, '.xlsx');
}
