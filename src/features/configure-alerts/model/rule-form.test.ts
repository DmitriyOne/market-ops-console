import { describe, expect, it } from 'vitest';

import {
  newRuleValues,
  parseThreshold,
  ruleFormSchema,
  type RuleFormValues,
  toFormValues,
  toRuleInput,
} from './rule-form';

const values = (over: Partial<RuleFormValues> = {}): RuleFormValues => ({
  ...newRuleValues([]),
  name: 'Low attainment',
  ...over,
});

const errors = (v: RuleFormValues, others: { name: string }[] = []): Record<string, string> => {
  const parsed = ruleFormSchema(others).safeParse(v);
  if (parsed.success) return {};
  return Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe('rule form', () => {
  it('reads a comma or a dot, rejects empty and words', () => {
    expect(parseThreshold('1,5')).toBe(1.5);
    expect(parseThreshold(' -5 ')).toBe(-5);
    expect(parseThreshold('−5')).toBe(-5);
    expect(parseThreshold('')).toBeNaN();
    expect(parseThreshold('abc')).toBeNaN();
    expect(parseThreshold('1e3')).toBeNaN();
  });

  it('turns the fields into a rule; revenue is typed in millions', () => {
    expect(toRuleInput(values({ metric: 'revenue', threshold: '1,1' }))).toMatchObject({
      threshold: 1_100_000,
    });
    expect(toRuleInput(values({ scopeKind: 'region', regionId: 'eu' })).scope).toEqual({
      kind: 'region',
      regionId: 'eu',
    });
    const rule = toRuleInput(
      values({ metric: 'revenue', threshold: '1.5', scopeKind: 'markets', marketIds: ['de'] }),
    );
    expect(toFormValues(rule)).toMatchObject({
      threshold: '1.5',
      marketIds: ['de'],
      scopeKind: 'markets',
    });
  });

  it('a new rule starts with the dashboard selection under "Markets"', () => {
    expect(newRuleValues(['de', 'es'])).toMatchObject({
      scopeKind: 'markets',
      marketIds: ['de', 'es'],
    });
    expect(newRuleValues([]).scopeKind).toBe('portfolio');
  });

  it('says what is wrong with translation keys', () => {
    expect(errors(values())).toEqual({});
    expect(errors(values({ name: ' ' }))).toEqual({ name: 'nameRequired' });
    expect(errors(values({ name: 'x'.repeat(61) }))).toEqual({ name: 'nameTooLong' });
    expect(errors(values({ name: 'share BELOW 10% ' }), [{ name: 'Share below 10%' }])).toEqual({
      name: 'duplicateName',
    });
    expect(errors(values({ threshold: '' }))).toEqual({ threshold: 'thresholdRequired' });
    expect(errors(values({ threshold: '250' }))).toEqual({ threshold: 'thresholdRange' });
    expect(errors(values({ metric: 'growth', threshold: '-100' }))).toEqual({});
    expect(errors(values({ metric: 'revenue', threshold: '-1' }))).toEqual({
      threshold: 'thresholdRange',
    });
    expect(errors(values({ scopeKind: 'region' }))).toEqual({ regionId: 'regionRequired' });
    expect(errors(values({ scopeKind: 'markets' }))).toEqual({ marketIds: 'marketsRequired' });
  });
});
