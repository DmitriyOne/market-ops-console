'use client';

import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { getMarket, useDashboard } from '@/entities/performance';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { useMarketSelection } from '../model/use-market-selection';

/** One chip per selected market, in the order chosen; × removes it. */
export function SelectionChips({ className }: { className?: string }) {
  const t = useTranslations('marketFilter');
  const { ds } = useDashboard();
  const { selected, toggle } = useMarketSelection();
  if (selected.length === 0) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {selected.map((id) => {
        const name = getMarket(ds, id)?.name ?? id;
        return (
          <li key={id}>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 gap-1 rounded-full"
              aria-label={t('remove', { name })}
              onClick={() => {
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
