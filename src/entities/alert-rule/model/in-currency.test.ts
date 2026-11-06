import { describe, expect, it } from 'vitest';

import type { AlertRuleInput } from '@/shared/api';

import { ruleInCurrency, ruleInUsd } from './in-currency';

const revenue: AlertRuleInput = {
  name: 'Revenue watch',
  metric: 'revenue',
  operator: 'below',
  threshold: 1_000_000,
  scope: { kind: 'portfolio' },
  severity: 'warning',
  enabled: true,
};
const share: AlertRuleInput = { ...revenue, metric: 'share', threshold: 10 };

describe('rule thresholds in a currency', () => {
  it('shows a revenue threshold in whole euros or pounds; USD and percentages stay', () => {
    expect(ruleInCurrency(revenue, 'EUR').threshold).toBe(890_950);
    expect(ruleInCurrency(revenue, 'GBP').threshold).toBe(742_990);
    expect(ruleInCurrency(revenue, 'USD')).toBe(revenue);
    expect(ruleInCurrency(share, 'EUR')).toBe(share);
  });

  it('stores a typed threshold in whole dollars', () => {
    expect(ruleInUsd({ ...revenue, threshold: 1_000_000 }, 'EUR').threshold).toBe(1_122_397);
    expect(ruleInUsd(share, 'GBP')).toBe(share);
  });

  it('keeps the stored dollars when the shown threshold did not change', () => {
    const stored = { ...revenue, threshold: 1_000_002 };
    const shown = ruleInCurrency(stored, 'GBP');
    expect(ruleInUsd({ ...shown, name: 'Renamed' }, 'GBP', stored).threshold).toBe(1_000_002);
    expect(ruleInUsd({ ...shown, threshold: 800_000 }, 'GBP', stored).threshold).toBe(1_076_731);
  });
});
