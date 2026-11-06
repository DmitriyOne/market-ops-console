import { describe, expect, it } from 'vitest';

import { marketsAtRiskCount, nonOnTrackMarkets, statusFor } from './status';
import { ds } from './test-dataset';

describe('statusFor', () => {
  it('returns the stored status only for the latest month', () => {
    expect(statusFor(ds, 'de', '2026-05', '1m')).toBe('off_track');
    expect(statusFor(ds, 'de', '2026-05', '3m')).toBeNull();
    expect(statusFor(ds, 'de', '2026-04', '1m')).toBeNull();
  });

  it('returns null for an unknown market', () => {
    expect(statusFor(ds, 'zz', '2026-05', '1m')).toBeNull();
  });
});

describe('nonOnTrackMarkets', () => {
  it('lists off-track first, then by attainment ascending', () => {
    expect(nonOnTrackMarkets(ds, '2026-05', '1m')?.map((m) => m.id)).toEqual([
      'de',
      'es',
      'it',
      'gb',
      'br',
      'fr',
    ]);
  });

  it('narrows to a scope', () => {
    expect(nonOnTrackMarkets(ds, '2026-05', '1m', { regionId: 'latam' })?.map((m) => m.id)).toEqual(
      ['br'],
    );
  });

  it('is null outside the latest month', () => {
    expect(nonOnTrackMarkets(ds, '2026-05', '3m')).toBeNull();
  });
});

describe('marketsAtRiskCount', () => {
  it('counts at-risk and off-track markets', () => {
    expect(marketsAtRiskCount(ds, '2026-05', '1m')).toBe(6);
    expect(marketsAtRiskCount(ds, '2026-05', '3m')).toBeNull();
  });
});
