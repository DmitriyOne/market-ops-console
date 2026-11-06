'use client';

import { evaluateRules, useAlertRules } from '@/entities/alert-rule';
import { useDataset } from '@/entities/performance';
import { useHydrated } from '@/shared/lib';

/**
 * How many markets the enabled rules flag now, for the header and the tab
 * bar; null until both the dataset and the rules are there. Never suspends.
 * Null while hydrating too: the rules can arrive before the bell's part of
 * the page hydrates, and the static HTML has no count.
 */
export function useFlaggedCount(): number | null {
  const hydrated = useHydrated();
  const { data: ds } = useDataset();
  const { data: rules } = useAlertRules();
  return hydrated && ds && rules ? evaluateRules(ds, rules).count : null;
}
