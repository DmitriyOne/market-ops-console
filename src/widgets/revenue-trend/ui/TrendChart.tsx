'use client';

import { useFormatter, useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';

import { periodToDate, type TrendView } from '@/entities/performance';
import { useMediaQuery } from '@/shared/lib';
// Direct path, not the shared/ui index: Recharts must stay in this lazy chunk.
import { ChartContainer } from '@/shared/ui/chart';

import { LegendLine } from './LegendLine';
import { SERIES, SERIES_KEYS as KEYS } from './series';

// Same as h-56; a number, so a hidden chart (phone Assistant tab) still has a size.
const CHART_HEIGHT = 224;
// text-xs, the smallest size on the type scale.
const TICK = { fontSize: 12 };
const MARK = 'var(--color-muted-foreground)';

type TrendChartProps = { view: TrendView; title: string };

/** Tooltip for one month: the three values in the project's currency format. */
function TrendTooltip({
  active,
  label,
  byPeriod,
}: Partial<Pick<TooltipContentProps, 'active' | 'label'>> & {
  byPeriod: Map<string, TrendView['points'][number]>;
}) {
  const t = useTranslations('trend');
  const format = useFormatter();
  const point = typeof label === 'string' ? byPeriod.get(label) : undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-2 text-xs text-popover-foreground shadow-sm">
      <p className="mb-1 font-semibold">{format.dateTime(periodToDate(point.period), 'period')}</p>
      <dl className="grid grid-cols-2 gap-x-3 font-mono tabular-nums">
        {KEYS.map((key) => (
          <div key={key} className="contents">
            {/* The line's own colour and pattern, as in the legend. */}
            <dt className="flex items-center gap-1.5 font-sans text-muted-foreground">
              <LegendLine series={key} />
              {t(key)}
            </dt>
            <dd className="text-right">{format.number(point[key], 'compactCurrency')}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Recharts line chart, loaded on its own so the first paint does not wait
 * for it. Keyboard: the chart takes focus and arrow keys move the tooltip
 * (Recharts accessibility layer); the table toggle is the full alternative.
 */
export function TrendChart({ view, title }: TrendChartProps) {
  const t = useTranslations('trend');
  const format = useFormatter();
  const wide = useMediaQuery('(min-width: 40rem)');
  const still = useMediaQuery('(prefers-reduced-motion: reduce)');
  const period = (p: string) => format.dateTime(periodToDate(p), 'period');
  const axisPeriod = (p: string) =>
    format.dateTime(periodToDate(p), wide ? 'period' : 'periodShort');
  const money = (n: number) => format.number(n, 'compactCurrency');
  const byPeriod = new Map(view.points.map((p) => [p.period, p]));
  // A tick every half year; a phone gets one a year so labels do not collide.
  const every = wide ? 6 : 12;
  const ticks = view.points
    .filter((_, i, all) => i % every === 0 || i === all.length - 1)
    .map((p) => p.period);
  const single = view.window.from === view.window.to;
  // The window label sits above the plot, anchored away from the nearer edge.
  const at = view.points.findIndex((p) => p.period === view.window.to);
  const anchor: 'start' | 'middle' | 'end' =
    at > view.points.length * 0.75 ? 'end' : at < 3 ? 'start' : 'middle';
  const label = {
    value: single
      ? period(view.window.to)
      : t('windowRange', { from: period(view.window.from), to: period(view.window.to) }),
    position: 'top' as const,
    fill: MARK,
    fontSize: TICK.fontSize,
    textAnchor: anchor,
  };

  return (
    <ChartContainer className="h-56 w-full" height={CHART_HEIGHT}>
      <LineChart
        data={view.points}
        title={title}
        margin={{ top: 20, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} />
        {/* The selected month: a thin dashed line; a 3/12-month window: a light band. */}
        {single ? (
          <ReferenceLine x={view.window.to} stroke={MARK} strokeDasharray="4 3" label={label} />
        ) : (
          <ReferenceArea
            x1={view.window.from}
            x2={view.window.to}
            fill="var(--color-muted)"
            fillOpacity={0.7}
            label={label}
          />
        )}
        <XAxis
          dataKey="period"
          ticks={ticks}
          tickFormatter={axisPeriod}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          padding={{ left: 8, right: 8 }}
        />
        <YAxis
          tickFormatter={money}
          tick={TICK}
          width={wide ? 64 : 52}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={<TrendTooltip byPeriod={byPeriod} />}
          cursor={{ stroke: 'var(--color-border)' }}
        />
        {KEYS.map((key) => (
          <Line
            key={key}
            dataKey={key}
            name={t(key)}
            type="monotone"
            dot={false}
            stroke={SERIES[key].stroke}
            strokeWidth={SERIES[key].width}
            strokeDasharray={SERIES[key].dash}
            // Draws in on load and moves to new values on a period change.
            isAnimationActive={!still}
            animationDuration={700}
            animationEasing="ease-out"
          />
        ))}
        {view.anomalies.map((a) => (
          <ReferenceDot
            key={`${a.marketId}-${a.period}`}
            x={a.period}
            y={a.actual}
            r={5}
            fill="var(--color-card)"
            stroke="var(--color-chart-4)"
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
