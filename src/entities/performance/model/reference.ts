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
