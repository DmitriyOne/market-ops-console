'use client';

import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { getMarket, useDashboard } from '@/entities/performance';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { useMarketSelection } from '../model/use-market-selection';

/**
 * One chip per selected market, in the order chosen; × removes it. The
 * removed chip had focus: it moves to the chip now in its place (or the
 * one before), and to `onEmptied` once none is left.
 */
export function SelectionChips({
  className,
  onEmptied,
}: {
  className?: string;
  onEmptied?: () => void;
}) {
  const t = useTranslations('marketFilter');
  const { ds } = useDashboard();
  const { selected, toggle } = useMarketSelection();
  const list = useRef<HTMLUListElement>(null);
  // The chip just removed and the list it left, until the list has changed.
  // A ref: the URL change re-renders, nothing else needs to.
  const removed = useRef<{ index: number; from: readonly string[] } | null>(null);

  useEffect(() => {
    const last = removed.current;
    if (last === null || last.from === selected) return;
    removed.current = null;
    const chips = list.current?.querySelectorAll('button') ?? [];
    const next = chips[Math.min(last.index, chips.length - 1)];
    if (next) next.focus();
    else onEmptied?.();
  }, [selected, onEmptied]);

  if (selected.length === 0) return null;
  return (
    <ul ref={list} className={cn('flex flex-wrap gap-2', className)}>
      {selected.map((id, index) => {
        const name = getMarket(ds, id)?.name ?? id;
        return (
          <li key={id}>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 gap-1 rounded-full"
              aria-label={t('remove', { name })}
              onClick={() => {
                removed.current = { index, from: selected };
                toggle(id);
              }}
            >
              {name}
              <XIcon aria-hidden />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
