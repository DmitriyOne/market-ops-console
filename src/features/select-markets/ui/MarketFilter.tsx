'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { marketsInOrder, nonOnTrackMarkets, useDashboard } from '@/entities/performance';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

import { useMarketSelection } from '../model/use-market-selection';

// Several picks in one go: a checkbox click leaves the menu open.
const keepOpen = (e: Event) => {
  e.preventDefault();
};

/**
 * The table filter: a menu with "At risk or off track", a line per region
 * (all of it, or none) and a checkbox per market of the scope, then "Clear
 * all"; next to it, how many of the scope's markets are selected. The chips
 * go on their own row (`SelectionChips`). The map and the tiles change the
 * same list.
 */
export function MarketFilter() {
  const t = useTranslations('marketFilter');
  const { ds, state } = useDashboard();
  const { selected, toggle, set, clear } = useMarketSelection();
  const { scope, period, range } = state;
  const markets = marketsInOrder(ds).filter(
    (m) => !scope.regionId || m.regionId === scope.regionId,
  );
  const regions = ds.regions.filter((r) => markets.some((m) => m.regionId === r.id));
  const chosen = new Set(selected);
  const inScope = markets.filter((m) => chosen.has(m.id)).length;
  // Status exists for the latest month only (spec §5).
  const atRisk = nonOnTrackMarkets(ds, period, range, { regionId: scope.regionId });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="min-h-11 gap-1">
            {selected.length > 0 ? t('buttonCount', { count: selected.length }) : t('button')}
            <ChevronDownIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          collisionPadding={15}
          className="max-h-(--radix-dropdown-menu-content-available-height) min-w-60 overflow-y-auto"
        >
          <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
          <DropdownMenuItem
            className="min-h-11 flex-col items-start gap-0"
            disabled={!atRisk}
            onSelect={() => {
              if (atRisk) set(atRisk.map((m) => m.id));
            }}
          >
            {t('atRisk')}
            {atRisk ? null : (
              <span className="text-xs text-muted-foreground">{t('atRiskLatestOnly')}</span>
            )}
          </DropdownMenuItem>
          {regions.map((region) => {
            const own = markets.filter((m) => m.regionId === region.id);
            const picked = own.filter((m) => chosen.has(m.id)).length;
            const all = picked === own.length;
            return (
              <DropdownMenuGroup key={region.id}>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={all ? true : picked > 0 ? 'indeterminate' : false}
                  className="min-h-11 font-medium"
                  onSelect={keepOpen}
                  onCheckedChange={() => {
                    const ids = new Set(own.map((m) => m.id));
                    set(
                      all
                        ? selected.filter((id) => !ids.has(id))
                        : [...selected, ...own.map((m) => m.id).filter((id) => !chosen.has(id))],
                    );
                  }}
                >
                  {t('region', { region: region.name })}
                </DropdownMenuCheckboxItem>
                {own.map((m) => (
                  <DropdownMenuCheckboxItem
                    key={m.id}
                    checked={chosen.has(m.id)}
                    className="min-h-11 pl-5"
                    onSelect={keepOpen}
                    onCheckedChange={() => {
                      toggle(m.id);
                    }}
                  >
                    {m.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-11" disabled={selected.length === 0} onSelect={clear}>
            {t('clearAll')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.length > 0 ? (
        <span className="text-xs text-muted-foreground">
          {t('count', { selected: inScope, total: markets.length })}
        </span>
      ) : null}
    </div>
  );
}
