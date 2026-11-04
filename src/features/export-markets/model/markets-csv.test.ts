import { describe, expect, it } from 'vitest';

import raw from '@/data/data.json';
import { marketsTable } from '@/entities/performance';
import { datasetSchema } from '@/shared/api';

import { MARKETS_CSV_HEADER, marketsCsv, marketsCsvName } from './markets-csv';

const ds = datasetSchema.parse(raw);
const lines = (csv: string) => csv.slice(1).trimEnd().split('\r\n');

describe('marketsCsv', () => {
  it('one line per row shown, raw USD and percent numbers, no total', () => {
    const view = marketsTable(ds, {}, '2026-05', '1m', [], { column: 'growth', dir: 'asc' });
    const [header, ...rows] = lines(marketsCsv(view));
    expect(header).toBe(MARKETS_CSV_HEADER.join(','));
    expect(header).toBe(
      'market_id,market,region,revenue_usd,gap_to_forecast_usd,attainment_pct,growth_pct,share_pct,units,status',
    );
    expect(rows).toHaveLength(13);
    const de = rows[0]?.split(',');
    expect(de?.slice(0, 3)).toEqual(['de', 'Germany', 'Europe']);
    expect(de?.[6]).toBe('-9.7');
    expect(de?.[9]).toBe('off_track');
    expect(Number(de?.[3])).toBe(Math.round(Number(de?.[3])));
  });

  it('values the view does not have are empty cells', () => {
    const view = marketsTable(ds, {}, '2026-05', '3m', ['de'], null);
    const de = lines(marketsCsv(view))[1]?.split(',');
    expect(de?.[7]).toBe('');
    expect(de?.[9]).toBe('');
  });
});

describe('marketsCsvName', () => {
  it('names the period, the window and the product', () => {
    expect(marketsCsvName('2026-05', '1m')).toBe('markets-2026-05-1m.csv');
    expect(marketsCsvName('2026-03', '12m', 'veltrix')).toBe('markets-2026-03-12m-veltrix.csv');
  });
});
