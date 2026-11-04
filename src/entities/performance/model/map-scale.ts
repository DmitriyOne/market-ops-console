/** Map metrics, as the `kpi` URL param spells them (spec §6). */
export const MAP_METRICS = ['status', 'attainment', 'growth', 'share', 'revenue'] as const;
export type MapMetric = (typeof MAP_METRICS)[number];
export type ScaleMetric = Exclude<MapMetric, 'status'>;

export type MapScale = {
  kind: 'diverging' | 'sequential';
  /** Lower bounds of steps 2…n; a value on a bound belongs to the upper step. */
  breaks: readonly number[];
  /** Palette slot per step: `--scale-div-N` or `--scale-seq-N`. */
  tones: readonly number[];
};

/**
 * Stepped scales, checked on every month × window of the data
 * (plan 2026-11-04-04). Attainment keeps equal arms around "on plan" by
 * skipping the lightest blue; growth uses all six diverging slots. Revenue
 * breaks are per month and are multiplied by the months in the window.
 */
export const MAP_SCALES: Record<ScaleMetric, MapScale> = {
  attainment: { kind: 'diverging', breaks: [94, 98, 102, 105], tones: [1, 2, 3, 5, 6] },
  growth: { kind: 'diverging', breaks: [-5, -1, 1, 5, 10], tones: [1, 2, 3, 4, 5, 6] },
  share: { kind: 'sequential', breaks: [10, 15, 20, 30], tones: [1, 2, 3, 4, 5] },
  revenue: {
    kind: 'sequential',
    breaks: [1_000_000, 1_500_000, 2_000_000, 3_000_000],
    tones: [1, 2, 3, 4, 5],
  },
};

/**
 * The value as the UI prints it, in whole units the breaks are exact in:
 * tenths of a percent, or dollars for revenue ("$999.9K", "$1.5M").
 * Percent: `toFixed` on the fraction the formatter gets rounds half away
 * from zero exactly as `Intl.NumberFormat` does (−1.05 → "−1.1 %").
 */
function shown(metric: ScaleMetric, value: number): number {
  if (metric !== 'revenue') return Math.round(Number((value / 100).toFixed(3)) * 1000);
  // Revenue is positive: Math.round halves up, as Intl does ("$1.45M" → "$1.5M").
  const hundreds = Math.round(value / 100) * 100;
  return hundreds < 1_000_000 ? hundreds : Math.round(value / 100_000) * 100_000;
}

function bounds(metric: ScaleMetric, months: number): number[] {
  const { breaks } = MAP_SCALES[metric];
  return metric === 'revenue' ? breaks.map((b) => b * months) : [...breaks];
}

/** Step index (0-based) of a value, judged by the value the user reads. */
export function stepFor(metric: ScaleMetric, value: number, months: number): number {
  const v = shown(metric, value);
  const unit = metric === 'revenue' ? 1 : 10;
  return bounds(metric, months).filter((b) => v >= Math.round(b * unit)).length;
}

export type ScaleStep = { from: number | null; to: number | null; tone: number };

/** The legend rows: open ends at both sides. */
export function scaleSteps(metric: ScaleMetric, months: number): ScaleStep[] {
  const b = bounds(metric, months);
  return MAP_SCALES[metric].tones.map((tone, i) => ({
    from: i === 0 ? null : (b[i - 1] ?? null),
    to: b[i] ?? null,
    tone,
  }));
}
