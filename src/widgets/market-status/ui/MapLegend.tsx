'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { type MarketMapView, StatusIcon, useStatusLabel } from '@/entities/performance';
import type { MarketStatus } from '@/shared/api';

import { STATUS_FILL, toneFill } from './map-colours';
import { useMapFormat } from './use-map-format';

const STATUSES: MarketStatus[] = ['on_track', 'at_risk', 'off_track'];

/** A square of the map's fill, with the same dots or hatching. */
function Swatch({ fill, pattern }: { fill: string; pattern?: 'dots' | 'hatch' }) {
  const id = useId();
  return (
    <svg aria-hidden width={14} height={14} className="shrink-0 rounded-xs">
      {pattern ? (
        <defs>
          <pattern
            id={id}
            width={4}
            height={4}
            patternUnits="userSpaceOnUse"
            patternTransform={pattern === 'hatch' ? 'rotate(45)' : undefined}
          >
            {pattern === 'dots' ? (
              <circle cx={2} cy={2} r={0.9} fill="var(--card)" fillOpacity={0.85} />
            ) : (
              <rect width={1.4} height={4} fill="var(--card)" fillOpacity={0.85} />
            )}
          </pattern>
        </defs>
      ) : null}
      <rect width={14} height={14} fill={fill} />
      {pattern ? <rect width={14} height={14} fill={`url(#${id})`} /> : null}
    </svg>
  );
}

/** Steps or statuses with how many markets in scope fall in each. */
export function MapLegend({ view }: { view: MarketMapView }) {
  const t = useTranslations('marketStatus');
  const statusLabel = useStatusLabel();
  const m = useMapFormat();
  const { legend } = view;
  const metric = view.metric === 'status' ? 'attainment' : view.metric;

  return (
    <ul
      aria-label={t('legend')}
      className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
    >
      {legend.kind === 'status'
        ? STATUSES.map((status) => (
            <li key={status} className="flex items-center gap-1.5">
              <Swatch
                fill={STATUS_FILL[status]}
                pattern={
                  status === 'at_risk' ? 'dots' : status === 'off_track' ? 'hatch' : undefined
                }
              />
              <StatusIcon status={status} />
              {statusLabel(status)}
              <span className="font-mono tabular-nums">{legend.counts[status]}</span>
              {status === 'at_risk' ? `· ${t('dotted')}` : null}
              {status === 'off_track' ? `· ${t('hatched')}` : null}
            </li>
          ))
        : legend.steps.map((step) => (
            <li key={step.tone} className="flex items-center gap-1.5">
              <Swatch fill={toneFill(legend.scale, step.tone)} />
              {step.from === null && step.to !== null
                ? t('below', { to: m.bound(metric, step.to) })
                : step.to === null && step.from !== null
                  ? t('above', { from: m.bound(metric, step.from) })
                  : m.range(metric, step.from ?? 0, step.to ?? 0)}
              <span className="font-mono tabular-nums">{step.count}</span>
            </li>
          ))}
    </ul>
  );
}
