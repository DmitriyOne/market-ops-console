'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useCallback, useMemo } from 'react';

import type { AlertRule, Dataset } from '@/shared/api';
import { useCurrency } from '@/shared/lib';

import { alertsQueryOptions } from '../api/alerts-query';
import { type AlertFlags, evaluateRules, NO_FLAGS } from './evaluate';
import { ruleInCurrency } from './in-currency';

/**
 * The user's rules, revenue thresholds in the chosen currency like the
 * dataset (ADR 0017); the cache keeps the API's USD. Never suspends, so a
 * slow or failed list hides only the bells.
 */
export function useAlertRules() {
  const currency = useCurrency();
  const select = useCallback(
    (rules: AlertRule[]) => rules.map((r) => ruleInCurrency(r, currency)),
    [currency],
  );
  return useQuery({ ...alertsQueryOptions(useLocale()), select });
}

/** What the rules flag now in `ds` (the chosen currency); nothing until they load or when they fail. */
export function useAlertFlags(ds: Dataset): AlertFlags {
  const { data } = useAlertRules();
  return useMemo(() => (data ? evaluateRules(ds, data) : NO_FLAGS), [ds, data]);
}

export type { AlertRule };
