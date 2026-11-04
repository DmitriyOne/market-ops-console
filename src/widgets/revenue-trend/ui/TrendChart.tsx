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
import { ChartContainer } from '@/shared/ui';

// Token colours; the legend repeats each line's pattern, so colour is never the only signal.
export const SERIES = {
  actual: { stroke: 'var(--color-chart-1)', dash: undefined, width: 2.2 },
  forecast: { stroke: 'var(--color-chart-5)', dash: '5 3', width: 2 },
  priorYear: { stroke: 'var(--color-chart-3)', dash: '1.5 3', width: 2 },
} as const;
export type SeriesKey = keyof typeof SERIES;
const KEYS: SeriesKey[] = ['actual', 'forecast', 'priorYear'];

type TrendChartProps = { view: TrendView; title: string };

/**
 * Recharts line chart, loaded on its own so the first paint does not wait
 * for it. Keyboard: the chart takes focus and arrow keys move the tooltip
 * (Recharts accessibility layer); the table toggle is the full alternative.
 */
export function TrendChart({ view, title }: TrendChartProps) {
  const t = useTranslations('trend');
  const format = useFormatter();
  const period = (p: string) => format.dateTime(periodToDate(p), 'period');
  const money = (n: number) => format.number(n, 'compactCurrency');
  const byPeriod = new Map(view.points.map((p) => [p.period, p]));
  const ticks = view.points
    .filter((_, i, all) => i % 6 === 0 || i === all.length - 1)
    .map((p) => p.period);
  const single = view.window.from === view.window.to;

  const TooltipBody = ({ active, label }: TooltipContentProps) => {
    const point = typeof label === 'string' ? byPeriod.get(label) : undefined;
    if (!active || !point) return null;
    return (
      <div className="rounded-lg border border-border bg-popover p-2 text-xs text-popover-foreground shadow-sm">
        <p className="mb-1 font-semibold">{period(point.period)}</p>
        <dl className="grid grid-cols-2 gap-x-3 font-mono tabular-nums">
          {KEYS.map((key) => (
            <div key={key} className="contents">
              <dt className="font-sans text-muted-foreground">{t(key)}</dt>
              <dd className="text-right">{money(point[key])}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  return (
    <ChartContainer className="h-56 w-full">
      <LineChart data={view.points} title={title} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        {single ? (
          <ReferenceLine x={view.window.to} stroke="var(--color-border)" strokeWidth={8} />
        ) : (
          <ReferenceArea
            x1={view.window.from}
            x2={view.window.to}
            fill="var(--color-muted)"
            fillOpacity={1}
          />
        )}
        <XAxis
          dataKey="period"
          ticks={ticks}
          tickFormatter={period}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={money}
          width={64}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip content={TooltipBody} cursor={{ stroke: 'var(--color-border)' }} />
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
            isAnimationActive={false}
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
