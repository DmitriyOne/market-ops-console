import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import raw from '@/data/data.json';
import { marketsMonthly, marketsTable, type TableColumn } from '@/entities/performance';
import { datasetSchema } from '@/shared/api';

import { type MarketsSheetLabels, marketsXlsx, marketsXlsxName } from './markets-xlsx';

const ds = datasetSchema.parse(raw);

const HEADERS: Record<TableColumn, string> = {
  market: 'Market',
  region: 'Region',
  revenue: 'Revenue',
  forecast: 'Forecast',
  gap: 'Gap to forecast',
  attainment: 'Attainment',
  priorYear: 'Prior year',
  growth: 'Growth YoY',
  share: 'Share',
  units: 'Units',
  status: 'Status',
};
const STATUS = { on_track: 'On track', at_risk: 'At risk', off_track: 'Off track' } as const;

const LABELS: MarketsSheetLabels = {
  sheets: { markets: 'Markets', months: 'By month', about: 'About' },
  title: 'Markets · Portfolio · 3 months to May 2026',
  header: (column) => HEADERS[column],
  status: (status) => STATUS[status],
  code: 'Code',
  anomaly: 'Anomaly',
  total: 'Total',
  month: 'Month',
  actual: 'Actual',
  about: [
    { label: 'Source', value: 'data.json, generated 9 June 2026' },
    { label: 'Link', value: 'https://example.test/dashboard?mode=analyst', link: true },
  ],
};

async function book(selected: string[] = [], range: '1m' | '3m' = '3m') {
  const view = marketsTable(ds, {}, '2026-05', range, selected, {
    column: 'growth',
    dir: 'asc',
  });
  const months = marketsMonthly(ds, view, {}, '2026-05', range);
  const blob = await marketsXlsx(view, months, LABELS);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await blob.arrayBuffer());
  return wb;
}

const sheetOf = (wb: ExcelJS.Workbook, name: string) => {
  const sheet = wb.getWorksheet(name);
  if (!sheet) throw new Error(`no sheet ${name}`);
  return sheet;
};

describe('marketsXlsx', () => {
  it('three sheets: the table, the months behind it, and what the file is', async () => {
    const wb = await book();
    expect(wb.worksheets.map((s) => s.name)).toEqual(['Markets', 'By month', 'About']);
  });

  it('markets: a title, a header row frozen with the market column, a row per market and a total', async () => {
    const sheet = sheetOf(await book(), 'Markets');
    expect(sheet.getCell('A1').value).toBe(LABELS.title);
    expect(sheet.getRow(3).values).toEqual([
      undefined,
      'Market',
      'Code',
      'Region',
      'Revenue',
      'Forecast',
      'Gap to forecast',
      'Attainment',
      'Prior year',
      'Growth YoY',
      'Share',
      'Units',
      'Status',
      'Anomaly',
    ]);
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', xSplit: 1, ySplit: 3 });
    expect(sheet.getCell('A4').value).toBe('Germany');
    expect(sheet.getCell('A4').font.bold).toBe(true);
    expect(sheet.getCell('A17').value).toBe('Total');
  });

  it('numbers keep money and percent formats; words in the UI language; the anomaly in words', async () => {
    const sheet = sheetOf(await book(), 'Markets');
    const de = sheet.getRow(4);
    expect(typeof de.getCell(4).value).toBe('number');
    expect(de.getCell(4).numFmt).toContain('$');
    expect(de.getCell(9).numFmt).toContain('%');
    expect(de.getCell(12).value).toBeNull();
    expect(de.getCell(13).value).toBe('2026-03: Revenue fell 27% versus the prior month.');
  });

  it('totals follow the Excel filter (SUBTOTAL); attainment and growth are ratios of sums', async () => {
    const sheet = sheetOf(await book(['de', 'es'], '1m'), 'Markets');
    const total = sheet.getRow(6);
    expect(total.getCell(1).value).toBe('Total');
    expect(JSON.stringify(total.getCell(4).value)).toContain('SUBTOTAL(109');
    expect(JSON.stringify(total.getCell(7).value)).toMatch(
      /SUBTOTAL\(109,D4:D5\)\/SUBTOTAL\(109,E4:E5\)/,
    );
  });

  it('status and negative gaps carry a colour rule; the word stays', async () => {
    const sheet = sheetOf(await book(), 'Markets');
    // Read back by ExcelJS but missing from its types: checked with a schema, not a cast.
    const refs = z
      .array(z.object({ ref: z.string() }))
      .parse(Reflect.get(sheet, 'conditionalFormattings'))
      .map((c) => c.ref);
    expect(refs).toEqual(expect.arrayContaining(['L4:L16', 'F4:F16', 'I4:I16']));
  });

  it('by month: a dated row per market and month, frozen header', async () => {
    const sheet = sheetOf(await book(['de']), 'By month');
    expect(sheet.getRow(3).values).toEqual([
      undefined,
      'Market',
      'Code',
      'Region',
      'Month',
      'Actual',
      'Forecast',
      'Prior year',
      'Units',
    ]);
    expect(sheet.getCell('D4').value).toEqual(new Date(Date.UTC(2026, 2, 1)));
    expect(sheet.getCell('D4').numFmt).toBe('mmm yyyy');
    expect(sheet.getCell('A7').value).toBe('Total');
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 3 });
  });

  it('about: label and value rows; the link is a hyperlink', async () => {
    const sheet = sheetOf(await book(), 'About');
    expect(sheet.getCell('A1').value).toBe('Source');
    expect(sheet.getCell('B2').value).toEqual({
      text: 'https://example.test/dashboard?mode=analyst',
      hyperlink: 'https://example.test/dashboard?mode=analyst',
    });
  });

  it('is named like the CSV', () => {
    expect(marketsXlsxName('2026-05', '1m', 'veltrix')).toBe('markets-2026-05-1m-veltrix.xlsx');
  });
});
