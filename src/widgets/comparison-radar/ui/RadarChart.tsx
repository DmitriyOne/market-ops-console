'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as Chart,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';

import type { RadarAxis, RadarView } from '@/entities/performance';
import { useMediaQuery } from '@/shared/lib';
// Direct path, not the shared/ui index: Recharts must stay in this lazy chunk.
import { ChartContainer } from '@/shared/ui/chart';

import { LegendSample } from './LegendSample';
import { MarkerShape } from './MarkerShape';
import { REFERENCE, type SeriesStyle, seriesStyle } from './series';
import { useRadarFormat } from './use-radar-format';

const CHART_HEIGHT = 280;
const TICK = { fontSize: 12, fill: 'var(--color-muted-foreground)' };
/**
 * Room on the sides for the axis names ("Attainment", "Выполнение"): in a
 * narrow card the radius follows the width, and without it the names on the
 * left and right are cut off. A wide card is bound by its height, so the
 * margin changes nothing there.
 */
const MARGIN = { top: 8, right: 56, bottom: 8, left: 56 };
const REF_KEY = 'ref';

type Row = { axis: RadarAxis; label: string } & Record<string, number | string | undefined>;

function AxisTooltip({
  active,
  payload,
  view,
}: Partial<Pick<TooltipContentProps, 'active' | 'payload'>> & { view: RadarView }) {
  const f = useRadarFormat();
  const row: unknown = payload?.[0]?.payload;
  const axis = view.axes.find(
    (a) => typeof row === 'object' && row !== null && 'axis' in row && row.axis === a,
  );
  if (!active || !axis) return null;
  const lines = [
    ...view.series.map((s, i) => ({ s, style: seriesStyle(i) })),
    { s: view.reference, style: REFERENCE },
  ];
  return (
    <div className="rounded-lg border border-border bg-popover p-2 text-xs text-popover-foreground shadow-sm">
      <p className="mb-1 font-semibold">{f.axisName(axis)}</p>
      <dl className="grid grid-cols-2 gap-x-3 font-mono tabular-nums">
        {lines.map(({ s, style }) => (
          <div key={s.id} className="contents">
            <dt className="flex items-center gap-1.5 font-sans text-muted-foreground">
              <LegendSample style={style} />
              {f.name(s)}
            </dt>
            <dd className="text-right">{f.value(axis, s.values[axis]?.raw)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const dot = (style: SeriesStyle) =>
  function RadarDot({ cx, cy }: { cx?: number; cy?: number }) {
    return cx === undefined || cy === undefined ? (
      <g />
    ) : (
      <MarkerShape marker={style.marker} cx={cx} cy={cy} fill={style.stroke} />
    );
  };

/**
 * Recharts radar, loaded on its own. Positions are 0–1 between the peers'
 * worst and best; the tooltip and the table show the real values.
 */
export function RadarChart({ view, title }: { view: RadarView; title: string }) {
  const f = useRadarFormat();
  const still = useMediaQuery('(prefers-reduced-motion: reduce)');
  const data: Row[] = view.axes.map((axis) => {
    const row: Row = { axis, label: f.axisName(axis) };
    view.series.forEach((s, i) => {
      row[`s${String(i)}`] = s.values[axis]?.scaled;
    });
    row[REF_KEY] = view.reference.values[axis]?.scaled;
    return row;
  });

  return (
    <ChartContainer className="h-70 w-full" height={CHART_HEIGHT}>
      <Chart data={data} title={title} outerRadius="70%" margin={MARGIN}>
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis dataKey="label" tick={TICK} />
        <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
        <Radar
          dataKey={REF_KEY}
          stroke={REFERENCE.stroke}
          strokeDasharray={REFERENCE.dash}
          strokeWidth={2}
          fill="none"
          isAnimationActive={false}
        />
        {view.series.map((s, i) => {
          const style = seriesStyle(i);
          return (
            <Radar
              key={s.id}
              dataKey={`s${String(i)}`}
              stroke={style.stroke}
              strokeDasharray={style.dash}
              strokeWidth={2}
              fill={style.stroke}
              fillOpacity={0.06}
              dot={dot(style)}
              isAnimationActive={!still}
            />
          );
        })}
        <Tooltip content={<AxisTooltip view={view} />} />
      </Chart>
    </ChartContainer>
  );
}
