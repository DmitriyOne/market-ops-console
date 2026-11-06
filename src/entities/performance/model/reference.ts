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

/**
 * The names a scope is made of: `["Veltrix", "Germany"]`, `["Europe"]`, or
 * none for the whole portfolio. As the dataset has them (English); the
 * page shows places in its language (`useDatasetSelect`, ADR 0010) and the
 * UI joins them (`useScopeLabel`).
 */
export function scopeParts(
  ds: Dataset,
  scope: { regionId?: string; marketId?: string; productId?: string },
): string[] {
  const product = scope.productId ? getProduct(ds, scope.productId)?.name : undefined;
  const place = scope.marketId
    ? getMarket(ds, scope.marketId)?.name
    : scope.regionId
      ? getRegion(ds, scope.regionId)?.name
      : undefined;
  return [product, place].filter((n): n is string => Boolean(n));
}
