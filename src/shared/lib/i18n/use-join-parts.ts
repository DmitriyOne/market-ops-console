import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

type Part = string | null | undefined | false;

/**
 * Joins label parts ("Veltrix · Germany · Mar 2026") with the dictionary's
 * separator, so no punctuation is written in code (ADR 0011). Empty parts
 * are dropped. A list of names reads better with `format.list`.
 */
export function useJoinParts(): (parts: readonly Part[]) => string {
  const separator = useTranslations('common')('separator');
  return useCallback(
    (parts) => parts.filter((p): p is string => Boolean(p)).join(separator),
    [separator],
  );
}
