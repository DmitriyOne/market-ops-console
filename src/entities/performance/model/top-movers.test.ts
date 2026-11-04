import { describe, expect, it } from 'vitest';

import { ds } from './test-dataset';
import { topMovers } from './top-movers';

const ids = (items: { id: string }[]) => items.map((i) => i.id);

describe('topMovers', () => {
  it('portfolio, May 2026: three risers and three fallers by growth YoY', () => {
    const m = topMovers(ds, {}, '2026-05', '1m');
    expect(ids(m.risers)).toEqual(['cn', 'fr', 'ca']);
    expect(ids(m.fallers)).toEqual(['de', 'es', 'it']);
    expect(m.risers[0]).toMatchObject({
      name: 'China',
      growthPct: { value: 18.2, source: 'data' },
    });
  });

  it('a small region splits its markets without listing one twice', () => {
    const m = topMovers(ds, { regionId: 'na' }, '2026-05', '1m');
    expect(m.risers).toHaveLength(1);
    expect(m.fallers).toHaveLength(1);
    expect(new Set([...ids(m.risers), ...ids(m.fallers)]).size).toBe(2);
  });

  it('a chosen market is compared within its region and marked', () => {
    const m = topMovers(ds, { regionId: 'eu', marketId: 'de' }, '2026-05', '1m');
    expect([...m.risers, ...m.fallers]).toHaveLength(5);
    expect(m.fallers.find((i) => i.id === 'de')?.selected).toBe(true);
  });

  it('follows the window: a wider range uses calculated growth', () => {
    const m = topMovers(ds, {}, '2026-05', '12m');
    expect(m.risers[0]?.growthPct.source).toBe('calculated');
  });

  it('a product compares that product across the markets', () => {
    const m = topMovers(
      ds,
      { regionId: 'eu', marketId: 'de', productId: 'veltrix' },
      '2026-05',
      '1m',
    );
    expect([...m.risers, ...m.fallers].every((i) => i.growthPct.source === 'calculated')).toBe(
      true,
    );
  });
});
