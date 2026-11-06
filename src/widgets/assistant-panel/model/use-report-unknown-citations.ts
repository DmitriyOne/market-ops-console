'use client';

import { useEffect, useRef } from 'react';

import { resolveCitation } from '@/entities/performance';
import type { ChatMessage } from '@/features/ask-question';
import type { Dataset } from '@/shared/api';
import { logWarning } from '@/shared/lib';

/**
 * An answer that cites a market, region, product or period the dataset does
 * not have means the AI or the data is wrong; the UI shows "Not in the
 * dataset", and Sentry gets a warning once per answer (ADR 0019). Answers
 * restored after a reload were checked when they arrived: the first pass
 * only records them. An answer that finishes before the dataset arrives is
 * checked when it does.
 */
export function useReportUnknownCitations(
  ds: Dataset | undefined,
  messages: readonly ChatMessage[],
  ready: boolean,
): void {
  const checked = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (checked.current === null) {
      checked.current = new Set(messages.filter((m) => m.status === 'done').map((m) => m.id));
      return;
    }
    if (!ds) return;
    for (const m of messages) {
      if (m.status !== 'done' || checked.current.has(m.id)) continue;
      checked.current.add(m.id);
      const unknown = m.citations.filter(
        (c) =>
          !resolveCitation(ds, c).known ||
          (c.period !== undefined && !ds.meta.periods.includes(c.period)),
      );
      if (unknown.length > 0) {
        logWarning('unknown_citation', {
          scope: 'chat',
          citations: unknown.map(({ marketId, regionId, productId, period }) => ({
            marketId,
            regionId,
            productId,
            period,
          })),
        });
      }
    }
  }, [ds, messages, ready]);
}
