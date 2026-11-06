'use client';

import { evaluateRules, useAlertRules } from '@/entities/alert-rule';
import { useDataset } from '@/entities/performance';

/**
 * How many markets the enabled rules flag now, for the header and the tab
 * bar; null until both the dataset and the rules are there. Never suspends.
 */
export function useFlaggedCount(): number | null {
  const { data: ds } = useDataset();
  const { data: rules } = useAlertRules();
  return ds && rules ? evaluateRules(ds, rules).count : null;
}
