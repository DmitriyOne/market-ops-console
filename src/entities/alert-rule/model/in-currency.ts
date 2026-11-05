import type { AlertRuleInput } from '@/shared/api';
import { type Currency, USD_RATES } from '@/shared/config';

/**
 * A rule as the UI shows and checks it: a revenue threshold in `currency`,
 * in whole units (ADR 0017). The API stores USD.
 */
export function ruleInCurrency<T extends AlertRuleInput>(rule: T, currency: Currency): T {
  if (rule.metric !== 'revenue' || currency === 'USD') return rule;
  return { ...rule, threshold: Math.round(rule.threshold * USD_RATES[currency]) };
}

/**
 * A rule from the UI back in USD, whole dollars. When its threshold is the
 * one `stored` shows, the stored USD value is kept: a round trip may land
 * a dollar off, and editing only the name must not move the threshold.
 */
export function ruleInUsd<T extends AlertRuleInput>(
  rule: T,
  currency: Currency,
  stored?: AlertRuleInput,
): T {
  if (rule.metric !== 'revenue' || currency === 'USD') return rule;
  if (
    stored?.metric === 'revenue' &&
    ruleInCurrency(stored, currency).threshold === rule.threshold
  ) {
    return { ...rule, threshold: stored.threshold };
  }
  return { ...rule, threshold: Math.round(rule.threshold / USD_RATES[currency]) };
}
