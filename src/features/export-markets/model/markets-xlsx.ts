import type { Worksheet } from 'exceljs';

import type { MarketsTableView, MonthlyRow, Range, TableColumn } from '@/entities/performance';
import type { MarketStatus, Period } from '@/shared/api';

import { anomalyText, marketsCsvName } from './markets-csv';

/** Words for the workbook in the UI language; numbers carry their own formats. */
export type MarketsSheetLabels = {
  sheets: { markets: string; months: string; about: string };
  /** First row of the data sheets: what they show (scope, window). */
  title: string;
  header: (column: TableColumn) => string;
  status: (status: MarketStatus) => string;
  code: string;
  anomaly: string;
  total: string;
  month: string;
  actual: string;
  /** The About sheet, one row each: source, view, filter, how values are made, a link back. */
  about: { label: string; value: string; link?: boolean }[];
};

const MONEY = '"$"#,##0';
const SIGNED_MONEY = '+"$"#,##0;-"$"#,##0;"$"0';
const PERCENT = '0.0%';
const SIGNED_PERCENT = '+0.0%;-0.0%;0.0%';
const INTEGER = '#,##0';
const MONTH = 'mmm yyyy';

// File colours (not UI tokens): Excel takes ARGB. Status tones match the app's.
const MARKET_FILL = 'FFEEF2F7';
const TOTAL_FILL = 'FFE2E8F0';
const OFF_TRACK = { fill: 'FFFDE2E1', font: 'FF9B1C1C' };
const AT_RISK = { fill: 'FFFEF3C7', font: 'FF92400E' };
const NEGATIVE = 'FFB91C1C';

/** The header sits on row 3, under a title and a blank row. */
const HEADER_ROW = 3;
const FIRST = HEADER_ROW + 1;

type Cell = string | number | Date | null;

// 8.8 → 0.088, not 0.08800000000000001 (what a spreadsheet would show in its formula bar).
const fraction = (n: number | null) => (n === null ? null : Math.round(n * 100) / 10_000);
const whole = (n: number | null) => (n === null ? null : Math.round(n));
const monthDate = (p: Period) => {
  const [y = 1970, m = 1] = p.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
};
const letter = (index: number) => String.fromCharCode(65 + index);
const span = (col: string, first: number, last: number) =>
  `${col}${String(first)}:${col}${String(last)}`;
// Blank, not #DIV/0!, when the filter hides every row or the base is 0.
const ratio = (formula: string) => `IFERROR(${formula},"")`;
// Σ share × revenue ÷ Σ revenue over the rows the filter shows (the UI's
// revenue-weighted share). SUBTOTAL over OFFSET gives each row's revenue, 0
// when hidden, so SUMPRODUCT weighs only the visible shares. The weight is the
// revenue column (the month's sum); the UI weighs by the stored revenue, a few
// dollars apart in the data, so the two agree to about 1e-6 %.
const weightedShare = (share: string, revenue: string, first: number, last: number) => {
  const top = `${revenue}${String(first)}`;
  const rows = `ROW(${span(revenue, first, last)})-ROW(${top})`;
  return ratio(
    `SUMPRODUCT(SUBTOTAL(109,OFFSET(${top},${rows},0)),${span(share, first, last)})/SUBTOTAL(109,${span(revenue, first, last)})`,
  );
};

type Column = {
  header: string;
  width: number;
  numFmt?: string;
  /** Total row: a label, a sum of the visible rows, or a formula of the visible rows. */
  total?: 'label' | 'sum' | ((first: number, last: number) => string);
};

/**
 * A title, then an Excel table (banded rows, filter buttons), then a total
 * row right under it. The total is written by hand, not as the table's own
 * totals row: ExcelJS drops custom totals formulas from the table XML, and
 * Excel then "repairs" the file. SUBTOTAL(109) still skips rows the filter
 * hides. Returns the last data row.
 */
function addTable(
  sheet: Worksheet,
  name: string,
  title: string,
  totalLabel: string,
  columns: readonly Column[],
  rows: Cell[][],
): number {
  sheet.getCell('A1').value = title;
  sheet.getCell('A1').font = { bold: true, size: 14 };
  const last = FIRST + Math.max(rows.length, 1) - 1;
  sheet.addTable({
    name,
    ref: `A${String(HEADER_ROW)}`,
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: columns.map((c) => ({ name: c.header, filterButton: true })),
    // A table needs a data row: header-only, Excel "repairs" the file.
    rows: rows.length > 0 ? rows : [columns.map(() => null)],
  });
  const total = sheet.getRow(last + 1);
  columns.forEach((c, i) => {
    const column = sheet.getColumn(i + 1);
    column.width = c.width;
    if (c.numFmt) column.numFmt = c.numFmt;
    const cell = total.getCell(i + 1);
    if (c.total === 'label') cell.value = totalLabel;
    else if (c.total === 'sum') {
      cell.value = { formula: `SUBTOTAL(109,${span(letter(i), FIRST, last)})` };
    } else if (c.total) cell.value = { formula: c.total(FIRST, last) };
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_FILL } };
    cell.border = { top: { style: 'double' } };
  });
  sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: HEADER_ROW }];
  return last;
}

const tone = (text: string, c: { fill: string; font: string }, priority: number) => ({
  type: 'containsText' as const,
  operator: 'containsText' as const,
  text,
  priority,
  style: {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, bgColor: { argb: c.fill } },
    font: { color: { argb: c.font } },
  },
});

const NEGATIVE_RULE = {
  type: 'cellIs' as const,
  operator: 'lessThan' as const,
  formulae: [0],
  priority: 1,
  style: { font: { color: { argb: NEGATIVE } } },
};

/**
 * The markets table as shown, as an Excel workbook for people:
 * 1. Markets: the rows as an Excel table (filters, banding, totals that
 *    follow the filter), money and percent formats, the market column
 *    frozen and shaded, status and negative values coloured (words stay).
 * 2. By month: the months behind it, dated, for pivots and charts.
 * 3. About: source, view, filter, how values are made, a link back.
 * ExcelJS loads only when a file is made.
 */
export async function marketsXlsx(
  view: MarketsTableView,
  months: readonly MonthlyRow[],
  labels: MarketsSheetLabels,
): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const book = new ExcelJS.Workbook();
  const h = labels.header;

  const markets = book.addWorksheet(labels.sheets.markets);
  const last = addTable(
    markets,
    // Table names are workbook-wide: not the same as a sheet name.
    'MarketsTable',
    labels.title,
    labels.total,
    [
      { header: h('market'), width: 18, total: 'label' },
      { header: labels.code, width: 7 },
      { header: h('region'), width: 15 },
      { header: h('revenue'), width: 14, numFmt: MONEY, total: 'sum' },
      { header: h('forecast'), width: 14, numFmt: MONEY, total: 'sum' },
      { header: h('gap'), width: 16, numFmt: SIGNED_MONEY, total: 'sum' },
      {
        header: h('attainment'),
        width: 12,
        numFmt: PERCENT,
        total: (a, b) => ratio(`SUBTOTAL(109,${span('D', a, b)})/SUBTOTAL(109,${span('E', a, b)})`),
      },
      { header: h('priorYear'), width: 14, numFmt: MONEY, total: 'sum' },
      {
        header: h('growth'),
        width: 12,
        numFmt: SIGNED_PERCENT,
        total: (a, b) =>
          ratio(`SUBTOTAL(109,${span('D', a, b)})/SUBTOTAL(109,${span('H', a, b)})-1`),
      },
      {
        header: h('share'),
        width: 10,
        numFmt: PERCENT,
        // Only where every row has a share, as in the UI (latest month, no product).
        total:
          view.totals.sharePct.value === null ? undefined : (a, b) => weightedShare('J', 'D', a, b),
      },
      { header: h('units'), width: 11, numFmt: INTEGER, total: 'sum' },
      { header: h('status'), width: 12 },
      { header: labels.anomaly, width: 48 },
    ],
    view.rows.map((r) => [
      r.name,
      r.code,
      r.regionName,
      whole(r.revenue.value),
      whole(r.forecast.value),
      whole(r.gap.value),
      fraction(r.attainmentPct.value),
      whole(r.priorYear.value),
      fraction(r.growthPct.value),
      fraction(r.sharePct.value),
      r.units.value,
      r.status ? labels.status(r.status) : null,
      anomalyText(r.anomalies),
    ]),
  );
  for (let row = FIRST; row <= last; row += 1) {
    const cell = markets.getCell(`A${String(row)}`);
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MARKET_FILL } };
  }
  markets.addConditionalFormatting({
    ref: span('L', FIRST, last),
    rules: [
      tone(labels.status('off_track'), OFF_TRACK, 1),
      tone(labels.status('at_risk'), AT_RISK, 2),
    ],
  });
  markets.addConditionalFormatting({ ref: span('F', FIRST, last), rules: [NEGATIVE_RULE] });
  markets.addConditionalFormatting({ ref: span('I', FIRST, last), rules: [NEGATIVE_RULE] });

  const monthly = book.addWorksheet(labels.sheets.months);
  addTable(
    monthly,
    'MonthsTable',
    labels.title,
    labels.total,
    [
      { header: h('market'), width: 18, total: 'label' },
      { header: labels.code, width: 7 },
      { header: h('region'), width: 15 },
      { header: labels.month, width: 11, numFmt: MONTH },
      { header: labels.actual, width: 14, numFmt: MONEY, total: 'sum' },
      { header: h('forecast'), width: 14, numFmt: MONEY, total: 'sum' },
      { header: h('priorYear'), width: 14, numFmt: MONEY, total: 'sum' },
      { header: h('units'), width: 11, numFmt: INTEGER, total: 'sum' },
    ],
    months.map((m) => [
      m.name,
      m.code,
      m.regionName,
      monthDate(m.period),
      Math.round(m.actual),
      Math.round(m.forecast),
      Math.round(m.priorYear),
      m.units,
    ]),
  );

  const about = book.addWorksheet(labels.sheets.about);
  about.getColumn(1).width = 24;
  about.getColumn(2).width = 80;
  labels.about.forEach((line, i) => {
    const row = about.getRow(i + 1);
    row.getCell(1).value = line.label;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = line.link ? { text: line.value, hyperlink: line.value } : line.value;
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  });

  const buffer = await book.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function marketsXlsxName(period: Period, range: Range, productId?: string): string {
  return marketsCsvName(period, range, productId).replace(/\.csv$/, '.xlsx');
}
