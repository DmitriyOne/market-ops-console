import type { AlertRuleInput } from '@/shared/api';
import { type Currency, USD_RATES } from '@/shared/config';

/**
 * A rule as the UI shows and checks it: a revenue threshold in `currency`
 * (ADR 0017), not rounded, so a market flags in every currency exactly when
 * it does in USD. The form shows it in whole units. The API stores USD.
 */
export function ruleInCurrency<T extends AlertRuleInput>(rule: T, currency: Currency): T {
  if (rule.metric !== 'revenue' || currency === 'USD') return rule;
  return { ...rule, threshold: rule.threshold * USD_RATES[currency] };
}

/**
 * A rule from the UI back in USD, whole dollars. When its threshold is the
 * one `stored` shows (in whole units, as the form has it), the stored USD
 * value is kept: a round trip may land a dollar off, and editing only the
 * name must not move the threshold.
 */
export function ruleInUsd<T extends AlertRuleInput>(
  rule: T,
  currency: Currency,
  stored?: AlertRuleInput,
): T {
  if (rule.metric !== 'revenue' || currency === 'USD') return rule;
  const shown = (r: AlertRuleInput) => Math.round(ruleInCurrency(r, currency).threshold);
  if (stored?.metric === 'revenue' && shown(stored) === Math.round(rule.threshold)) {
    return { ...rule, threshold: stored.threshold };
  }
  return { ...rule, threshold: Math.round(rule.threshold / USD_RATES[currency]) };
}
