'use client';

import { useQuery } from '@tanstack/react-query';

import { evaluateRules, useAlertRules } from '@/entities/alert-rule';
import { datasetQueryOptions } from '@/entities/performance';

/**
 * How many markets the enabled rules flag now, for the header and the tab
 * bar; null until both the dataset and the rules are there. Never suspends.
 */
export function useFlaggedCount(): number | null {
  const { data: ds } = useQuery(datasetQueryOptions);
  const { data: rules } = useAlertRules();
  return ds && rules ? evaluateRules(ds, rules).count : null;
}
