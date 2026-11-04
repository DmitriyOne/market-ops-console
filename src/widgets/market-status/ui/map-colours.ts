import { MAP_SCALES, type MapItem, type MarketMapView } from '@/entities/performance';
import type { MarketStatus } from '@/shared/api';

const LAND = 'var(--map-land)';

export const STATUS_FILL: Record<MarketStatus, string> = {
  on_track: 'var(--status-on-track)',
  at_risk: 'var(--status-at-risk)',
  off_track: 'var(--status-off-track)',
};

/** CSS colour of a scale step's palette slot. */
export function toneFill(scale: 'diverging' | 'sequential', tone: number): string {
  return `var(--scale-${scale === 'diverging' ? 'div' : 'seq'}-${String(tone)})`;
}

/** A market's fill: plain land outside the drilled region or without a value. */
export function itemFill(item: MapItem, view: MarketMapView): string {
  if (!item.inScope) return LAND;
  if (view.metric === 'status') return item.status ? STATUS_FILL[item.status] : LAND;
  if (item.step === null) return LAND;
  const scale = MAP_SCALES[view.metric];
  const tone = scale.tones[item.step];
  return tone === undefined ? LAND : toneFill(scale.kind, tone);
}
