'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

import type { AlertRule, Dataset } from '@/shared/api';
import { useCurrency } from '@/shared/lib';

import { alertsQueryOptions } from '../api/alerts-query';
import { type AlertFlags, evaluateRules, NO_FLAGS } from './evaluate';
import { ruleInCurrency } from './in-currency';

/**
 * A rule's name as the page shows it: an example (`preset`) in the page's
 * language, any other as the user saved it.
 */
export function useRuleName(): (rule: Pick<AlertRule, 'name' | 'preset'>) => string {
  const t = useTranslations('alerts.examples');
  return useCallback((rule) => (rule.preset ? t(rule.preset) : rule.name), [t]);
}

/**
 * The user's rules, revenue thresholds in the chosen currency like the
 * dataset (ADR 0017) and examples named in the page's language; the cache
 * keeps what the API stores. Never suspends, so a slow or failed list hides
 * only the bells.
 */
export function useAlertRules() {
  const currency = useCurrency();
  const nameOf = useRuleName();
  const select = useCallback(
    (rules: AlertRule[]) =>
      rules.map((r) => ruleInCurrency(r.preset ? { ...r, name: nameOf(r) } : r, currency)),
    [currency, nameOf],
  );
  return useQuery({ ...alertsQueryOptions(), select });
}

/**
 * What the rules flag now in `ds` (the chosen currency); nothing when they
 * fail. `pending` until the first answer: a widget shows a placeholder then,
 * not a "None" that turns into a bell a moment later (layout shift).
 */
export function useAlertFlags(ds: Dataset): AlertFlags & { pending: boolean } {
  const { data, isPending } = useAlertRules();
  return useMemo(
    () => ({ ...(data ? evaluateRules(ds, data) : NO_FLAGS), pending: isPending }),
    [ds, data, isPending],
  );
}

export type { AlertRule };
