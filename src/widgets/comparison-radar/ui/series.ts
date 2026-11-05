/** A marker drawn at each axis point, so a line reads without its colour. */
export type Marker = 'circle' | 'square' | 'triangle' | 'diamond' | 'none';
export type SeriesStyle = { stroke: string; dash?: string; marker: Marker };

/** Four categorical slots (`--series-N`, tokens.test.ts), each with its own dash and marker. */
export const SERIES: readonly SeriesStyle[] = [
  { stroke: 'var(--series-1)', marker: 'circle' },
  { stroke: 'var(--series-2)', dash: '7 3', marker: 'square' },
  { stroke: 'var(--series-3)', dash: '2 3', marker: 'triangle' },
  { stroke: 'var(--series-4)', dash: '9 3 2 3', marker: 'diamond' },
];

/** The portfolio average: grey and dashed, not one of the four colours. */
export const REFERENCE: SeriesStyle = {
  stroke: 'var(--muted-foreground)',
  dash: '4 4',
  marker: 'none',
};

export const seriesStyle = (index: number): SeriesStyle =>
  SERIES[index % SERIES.length] ?? REFERENCE;
