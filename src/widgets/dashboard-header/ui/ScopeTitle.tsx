'use client';

import { useFormatter, useTranslations } from 'next-intl';

import {
  getMarket,
  getProduct,
  getRegion,
  marketsInScope,
  periodToDate,
  useDashboard,
} from '@/entities/performance';
import { Skeleton } from '@/shared/ui';

/** "Veltrix · Germany" and what the scope holds; names stay English like the data. */
export function ScopeTitle() {
  const t = useTranslations('overview');
  const tDrill = useTranslations('drill');
  const format = useFormatter();
  const { ds, state } = useDashboard();
  const { regionId, marketId, productId } = state.scope;

  const product = productId ? getProduct(ds, productId)?.name : undefined;
  const place = marketId
    ? getMarket(ds, marketId)?.name
    : regionId
      ? getRegion(ds, regionId)?.name
      : undefined;
  const title = [product, place].filter(Boolean).join(' · ') || tDrill('portfolio');

  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {t('summary', {
          markets: marketsInScope(ds, state.scope).length,
          products: productId ? 1 : ds.products.length,
          period: format.dateTime(periodToDate(ds.meta.latestPeriod), 'period'),
        })}
      </p>
    </div>
  );
}

export function ScopeTitleSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-1.5">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}
