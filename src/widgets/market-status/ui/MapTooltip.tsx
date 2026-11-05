'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { AlertMark, useAlertFlags, useFlagLabel } from '@/entities/alert-rule';
import { type MapItem, type MapMetric, StatusChip, useDashboard } from '@/entities/performance';
import { cn, scrollMainToTop } from '@/shared/lib';
import { Button, Popover, PopoverAnchor, PopoverContent } from '@/shared/ui';

import { useMapFormat } from './use-map-format';

export type TooltipState = {
  id: string;
  /** Viewport point the tooltip points at. */
  at: [number, number];
  /** Touch adds the "Open" button: there is no hover to tell a look from a tap. */
  via: 'pointer' | 'touch' | 'focus';
};

type MapTooltipProps = {
  item: MapItem;
  metric: MapMetric;
  tip: TooltipState;
  onOpen: (marketId: string) => void;
  /** Analyst, a market of the scope: the touch tooltip also adds it to the table filter. */
  onToggle?: (marketId: string) => void;
  onClose: () => void;
};

/** Name, value and status of one market, next to the pointer or the focused country. */
export function MapTooltip({ item, metric, tip, onOpen, onToggle, onClose }: MapTooltipProps) {
  const t = useTranslations('marketStatus');
  const tKpi = useTranslations('kpi');
  const m = useMapFormat();
  const { ds } = useDashboard();
  const flag = useAlertFlags(ds).byMarket.get(item.id);
  const flagLabel = useFlagLabel();
  const [x, y] = tip.at;
  const anchor = useMemo(
    () => ({
      current: {
        // A zero-size box at the point.
        getBoundingClientRect: () => new DOMRect(x, y, 0, 0),
      },
    }),
    [x, y],
  );
  const touch = tip.via === 'touch';

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <PopoverAnchor virtualRef={anchor} />
      <PopoverContent
        side="top"
        sideOffset={8}
        collisionPadding={8}
        // Hover and focus tooltips never take focus or the pointer; the touch one holds a button.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        // A tap on another market moves the tooltip (its own click), not just closes it.
        onInteractOutside={(e) => {
          if (e.target instanceof Element && e.target.closest('[data-market]')) e.preventDefault();
        }}
        className={cn('w-auto max-w-64 gap-1.5 p-2 text-xs', !touch && 'pointer-events-none')}
      >
        <p className="text-sm font-semibold">{item.name}</p>
        <p className="flex items-baseline gap-1.5">
          <span className="text-muted-foreground">{m.metricLabel(m.valueMetric(metric))}</span>
          <span className="font-mono tabular-nums">{m.value(metric, item.value)}</span>
          {item.value.source === 'calculated' ? (
            <span className="text-muted-foreground">· {tKpi('calculated')}</span>
          ) : null}
        </p>
        {item.status ? (
          <div>
            <StatusChip status={item.status} />
          </div>
        ) : null}
        {/* Alerts are about the latest month, whatever month the map shows. */}
        {flag ? (
          <p className="flex items-start gap-1">
            <AlertMark flag={flag} labelled={false} className="mt-px" />
            {flagLabel(flag)}
          </p>
        ) : null}
        {touch ? (
          <Button
            type="button"
            className="min-h-11 w-full"
            onClick={() => {
              onOpen(item.id);
              // The market opens at the top of the page (title, KPIs): bring it into view.
              scrollMainToTop();
              onClose();
            }}
          >
            {t('openMarket', { name: item.name })}
          </Button>
        ) : null}
        {touch && onToggle ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => {
              onToggle(item.id);
              onClose();
            }}
          >
            {item.selected ? t('removeFromFilter') : t('addToFilter')}
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
