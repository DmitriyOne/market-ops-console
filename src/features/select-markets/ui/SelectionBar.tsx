'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui';

import { useMarketSelection } from '../model/use-market-selection';
import { SelectionChips } from './SelectionChips';

/**
 * The selection where there is no filter menu (Market status, also in
 * Executive): what is selected, a way to remove one or all. `onCleared`
 * gets focus somewhere sensible once the bar is gone (Clear, or the
 * last chip removed).
 */
export function SelectionBar({ onCleared }: { onCleared?: () => void }) {
  const t = useTranslations('marketFilter');
  const { selected, clear } = useMarketSelection();
  if (selected.length === 0) return null;
  return (
    <div role="group" aria-label={t('selected')} className="flex flex-wrap items-center gap-2">
      <span aria-hidden className="text-xs font-medium text-muted-foreground">
        {t('selected')}
      </span>
      <SelectionChips onEmptied={onCleared} />
      <Button
        type="button"
        variant="ghost"
        className="min-h-9"
        onClick={() => {
          clear();
          onCleared?.();
        }}
      >
        {t('clear')}
      </Button>
    </div>
  );
}
