import type { Dataset, Market, Product, Region } from '@/shared/api';

export function getMarket(ds: Dataset, id: string): Market | undefined {
  return ds.markets.find((m) => m.id === id);
}

export function getRegion(ds: Dataset, id: string): Region | undefined {
  return ds.regions.find((r) => r.id === id);
}

export function getProduct(ds: Dataset, id: string): Product | undefined {
  return ds.products.find((p) => p.id === id);
}

/** "Veltrix · Germany", "Europe", or null for the whole portfolio. Names stay English like the data. */
export function scopeLabel(
  ds: Dataset,
  scope: { regionId?: string; marketId?: string; productId?: string },
): string | null {
  const product = scope.productId ? getProduct(ds, scope.productId)?.name : undefined;
  const place = scope.marketId
    ? getMarket(ds, scope.marketId)?.name
    : scope.regionId
      ? getRegion(ds, scope.regionId)?.name
      : undefined;
  return [product, place].filter(Boolean).join(' · ') || null;
}
