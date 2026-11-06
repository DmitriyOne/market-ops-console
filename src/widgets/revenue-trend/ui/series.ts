// Kept apart from TrendChart so the legend does not pull Recharts into the first bundle.

/** Token colours and dash patterns; the legend repeats each line's pattern, so colour is never the only signal. */
export const SERIES = {
  actual: { stroke: 'var(--color-chart-1)', dash: undefined, width: 2.2 },
  forecast: { stroke: 'var(--color-chart-5)', dash: '5 3', width: 2 },
  priorYear: { stroke: 'var(--color-chart-3)', dash: '1.5 3', width: 2 },
} as const;

export type SeriesKey = keyof typeof SERIES;
export const SERIES_KEYS: SeriesKey[] = ['actual', 'forecast', 'priorYear'];
