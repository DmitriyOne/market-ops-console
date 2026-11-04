'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { marketsInOrder, useDashboard } from '@/entities/performance';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

import { useMarketSelection } from '../model/use-market-selection';

/**
 * The table filter row: a menu with a checkbox per market of the scope,
 * how many of them are selected, and Clear. The chips go on their own row
 * (`SelectionChips`). The map and the tiles change the same list.
 */
export function MarketFilter() {
  const t = useTranslations('marketFilter');
  const { ds, state } = useDashboard();
  const { selected, toggle, clear } = useMarketSelection();
  const trigger = useRef<HTMLButtonElement>(null);
  const markets = marketsInOrder(ds).filter(
    (m) => !state.scope.regionId || m.regionId === state.scope.regionId,
  );
  const regions = ds.regions.filter((r) => markets.some((m) => m.regionId === r.id));
  const chosen = new Set(selected);
  const inScope = markets.filter((m) => chosen.has(m.id)).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button ref={trigger} type="button" variant="outline" className="min-h-11 gap-1">
            {selected.length > 0 ? t('buttonCount', { count: selected.length }) : t('button')}
            <ChevronDownIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" collisionPadding={15} className="min-w-56">
          <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
          {regions.map((region, i) => (
            <DropdownMenuGroup key={region.id}>
              {i > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {region.name}
              </DropdownMenuLabel>
              {markets
                .filter((m) => m.regionId === region.id)
                .map((m) => (
                  <DropdownMenuCheckboxItem
                    key={m.id}
                    checked={chosen.has(m.id)}
                    className="min-h-11"
                    // Several markets in one go: the menu stays open.
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                    onCheckedChange={() => {
                      toggle(m.id);
                    }}
                  >
                    {m.name}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.length > 0 ? (
        <span className="text-xs text-muted-foreground">
          {t('count', { selected: inScope, total: markets.length })}
        </span>
      ) : null}
      {selected.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          className="min-h-9"
          onClick={() => {
            clear();
            trigger.current?.focus();
          }}
        >
          {t('clear')}
        </Button>
      ) : null}
    </div>
  );
}
