import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import raw from '@/data/data.json';
import { marketsTable } from '@/entities/performance';
import { datasetSchema } from '@/shared/api';

import { type MarketsSheetLabels, marketsXlsx, marketsXlsxName } from './markets-xlsx';

const ds = datasetSchema.parse(raw);

const HEADERS = {
  market: 'Market',
  region: 'Region',
  revenue: 'Revenue',
  gap: 'Gap to forecast',
  attainment: 'Attainment',
  growth: 'Growth YoY',
  share: 'Share',
  units: 'Units',
  status: 'Status',
};

const LABELS: MarketsSheetLabels = {
  sheet: 'Markets',
  title: 'Markets · Portfolio · May 2026',
  header: (column) => HEADERS[column],
  status: (status) =>
    ({ on_track: 'On track', at_risk: 'At risk', off_track: 'Off track' })[status],
};

async function read(view: ReturnType<typeof marketsTable>) {
  const blob = await marketsXlsx(view, LABELS);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await blob.arrayBuffer());
  const sheet = book.getWorksheet('Markets');
  if (!sheet) throw new Error('no sheet');
  return sheet;
}

describe('marketsXlsx', () => {
  it('a title, a header with a filter, frozen header and market column', async () => {
    const sheet = await read(marketsTable(ds, {}, '2026-05', '1m', [], null));
    expect(sheet.getCell('A1').value).toBe(LABELS.title);
    expect(sheet.getRow(2).values).toEqual([undefined, ...Object.values(HEADERS)]);
    expect(sheet.getCell('A2').font.bold).toBe(true);
    expect(sheet.autoFilter).toBe('A2:I2');
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', xSplit: 1, ySplit: 2 });
    expect(sheet.rowCount).toBe(15);
  });

  it('numbers stay numbers with money and percent formats; words in the UI language', async () => {
    const sheet = await read(
      marketsTable(ds, {}, '2026-05', '1m', [], { column: 'growth', dir: 'asc' }),
    );
    const de = sheet.getRow(3);
    expect(de.getCell(1).value).toBe('Germany');
    expect(typeof de.getCell(3).value).toBe('number');
    expect(de.getCell(3).numFmt).toContain('$');
    expect(de.getCell(6).value).toBe(-0.097);
    expect(de.getCell(7).value).toBe(0.089);
    expect(de.getCell(6).numFmt).toContain('%');
    expect(de.getCell(9).value).toBe('Off track');
  });

  it('missing values are empty cells', async () => {
    const sheet = await read(marketsTable(ds, {}, '2026-05', '3m', ['de'], null));
    expect(sheet.getRow(3).getCell(7).value).toBeNull();
    expect(sheet.getRow(3).getCell(9).value).toBeNull();
  });

  it('is named like the CSV', () => {
    expect(marketsXlsxName('2026-05', '1m', 'veltrix')).toBe('markets-2026-05-1m-veltrix.xlsx');
  });
});
