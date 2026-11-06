import { z } from 'zod';

export const periodSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const marketStatusSchema = z.enum(['on_track', 'at_risk', 'off_track']);

const regionSchema = z.object({ id: z.string(), name: z.string() });
const productSchema = z.object({ id: z.string(), name: z.string() });

const anomalySchema = z.object({
  period: periodSchema,
  type: z.string(),
  note: z.string(),
});

const marketKpisSchema = z.object({
  revenue: z.number(),
  growthPct: z.number(),
  sharePct: z.number(),
  forecastAttainmentPct: z.number(),
  status: marketStatusSchema,
  anomalies: z.array(anomalySchema),
});

const marketSchema = z.object({
  id: z.string(),
  name: z.string(),
  iso3: z.string().length(3),
  iso2: z.string().length(2),
  regionId: z.string(),
  kpis: marketKpisSchema,
});

const seriesRowSchema = z.object({
  marketId: z.string(),
  productId: z.string(),
  period: periodSchema,
  actual: z.number(),
  forecast: z.number(),
  units: z.number(),
  priorYear: z.number(),
});

const metaSchema = z.object({
  currency: z.string(),
  periods: z.array(periodSchema).min(1),
  latestPeriod: periodSchema,
  // A day (`2026-06-09`) or a timestamp; anything else is invalid data.
  generatedAt: z.union([z.iso.date(), z.iso.datetime({ offset: true })]),
});

export const datasetSchema = z
  .object({
    meta: metaSchema,
    regions: z.array(regionSchema),
    products: z.array(productSchema),
    markets: z.array(marketSchema),
    series: z.array(seriesRowSchema),
  })
  .superRefine((ds, ctx) => {
    const periods = new Set(ds.meta.periods);
    const regionIds = new Set(ds.regions.map((r) => r.id));
    const marketIds = new Set(ds.markets.map((m) => m.id));
    const productIds = new Set(ds.products.map((p) => p.id));

    if (ds.meta.latestPeriod !== ds.meta.periods.at(-1)) {
      ctx.addIssue({
        code: 'custom',
        path: ['meta', 'latestPeriod'],
        message: 'latestPeriod must be the last entry of periods',
      });
    }
    ds.markets.forEach((m, i) => {
      if (!regionIds.has(m.regionId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['markets', i, 'regionId'],
          message: 'Unknown region',
        });
      }
    });
    ds.series.forEach((row, i) => {
      if (!marketIds.has(row.marketId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['series', i, 'marketId'],
          message: 'Unknown market',
        });
      }
      if (!productIds.has(row.productId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['series', i, 'productId'],
          message: 'Unknown product',
        });
      }
      if (!periods.has(row.period)) {
        ctx.addIssue({ code: 'custom', path: ['series', i, 'period'], message: 'Unknown period' });
      }
    });
  });

export type Dataset = z.infer<typeof datasetSchema>;
export type Period = z.infer<typeof periodSchema>;
export type MarketStatus = z.infer<typeof marketStatusSchema>;
export type Region = z.infer<typeof regionSchema>;
export type Product = z.infer<typeof productSchema>;
export type Market = z.infer<typeof marketSchema>;
export type MarketKpis = z.infer<typeof marketKpisSchema>;
export type Anomaly = z.infer<typeof anomalySchema>;
export type SeriesRow = z.infer<typeof seriesRowSchema>;
