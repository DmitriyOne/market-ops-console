import { describe, expect, it } from 'vitest';

import { type AlertRuleInput, alertRuleInputSchema, alertRulesSchema } from './schema';

const base: AlertRuleInput = {
  name: 'Low growth',
  metric: 'growth',
  operator: 'below',
  threshold: 0,
  scope: { kind: 'portfolio' },
  severity: 'warning',
  enabled: true,
};

const messages = (value: unknown) => {
  const parsed = alertRuleInputSchema.safeParse(value);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
};

describe('alert rule schema', () => {
  it('accepts a plain rule and trims the name', () => {
    expect(alertRuleInputSchema.parse({ ...base, name: '  Low growth ' }).name).toBe('Low growth');
  });

  it.each([
    ['growth', -101, 'thresholdRange'],
    ['growth', 100, null],
    ['attainment', 201, 'thresholdRange'],
    ['share', -1, 'thresholdRange'],
    ['share', 100, null],
    ['revenue', -1, 'thresholdRange'],
    ['revenue', 5_000_000, null],
  ] as const)('%s threshold %d → %s', (metric, threshold, message) => {
    expect(messages({ ...base, metric, threshold })).toEqual(message ? [message] : []);
  });

  it('needs a name, a number and at least one market', () => {
    expect(messages({ ...base, name: '   ' })).toEqual(['nameRequired']);
    expect(messages({ ...base, threshold: Number.NaN })).toEqual(['thresholdRequired']);
    expect(messages({ ...base, scope: { kind: 'markets', marketIds: [] } })).toEqual([
      'marketsRequired',
    ]);
  });

  it('a list: names unique ignoring case and spaces, ten at most', () => {
    const rule = (id: string, name: string) => ({ ...base, id, name });
    const dup = alertRulesSchema.safeParse([rule('a', 'Low growth'), rule('b', 'LOW GROWTH ')]);
    expect(dup.success ? [] : dup.error.issues.map((i) => i.message)).toEqual(['duplicateName']);
    const eleven = Array.from({ length: 11 }, (_, i) => rule(String(i), `Rule ${String(i)}`));
    const many = alertRulesSchema.safeParse(eleven);
    expect(many.success ? [] : many.error.issues.map((i) => i.message)).toEqual(['tooMany']);
  });
});
