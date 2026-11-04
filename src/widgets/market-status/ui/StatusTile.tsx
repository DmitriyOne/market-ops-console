'use client';

import { useTranslations } from 'next-intl';

import { type MarketTile, StatusIcon, useKpiFormat, useStatusLabel } from '@/entities/performance';
import { cn } from '@/shared/lib';

const TONE = {
  on_track: 'bg-status-on-track-muted text-status-on-track',
  at_risk: 'bg-status-at-risk-muted text-status-at-risk',
  off_track: 'bg-status-off-track-muted text-status-off-track',
} as const;

/** One market: code, status shape, attainment. Click drills in. */
export function StatusTile({ tile, onSelect }: { tile: MarketTile; onSelect: () => void }) {
  const t = useTranslations('marketStatus');
  const f = useKpiFormat();
  const statusLabel = useStatusLabel();
  const value = f.value(tile.attainmentPct, 'percent');

  const name = [
    tile.status
      ? t('tile', { name: tile.name, status: statusLabel(tile.status), value })
      : t('tileNoStatus', { name: tile.name, value }),
    tile.highlighted ? t('highlighted') : null,
    tile.selected ? t('selected') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      aria-label={name}
      onClick={onSelect}
      className={cn(
        'relative flex min-h-14 flex-col items-start justify-center gap-0.5 overflow-hidden rounded-lg border border-transparent px-2 py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        tile.status ? TONE[tile.status] : 'bg-muted text-foreground',
        tile.selected && 'border-foreground',
        tile.highlighted && 'ring-2 ring-ring ring-offset-2 ring-offset-card',
      )}
    >
      {tile.status === 'off_track' ? (
        <span aria-hidden className="absolute inset-y-0 right-0 w-3 bg-hatch" />
      ) : null}
      <span className="flex items-center gap-1.5 text-xs font-semibold">
        {tile.iso2}
        {tile.status ? <StatusIcon status={tile.status} /> : null}
      </span>
      <span className="font-mono text-sm tabular-nums">{value}</span>
    </button>
  );
}
