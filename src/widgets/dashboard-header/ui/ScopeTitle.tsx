'use client';

import { LayoutDashboardIcon, MicroscopeIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { marketsInScope, periodToDate, useDashboard, useScopeLabel } from '@/entities/performance';
import { CopyLinkButton, CopyLinkButtonSkeleton } from '@/features/share-link';
import { cn } from '@/shared/lib';
import { Skeleton } from '@/shared/ui';

/**
 * "Veltrix · Germany" and what the scope holds; names stay English like the
 * data. The view's name sits next to it with what it adds, so a switch of
 * mode shows at the top, not only far below (owner, 2026-11-05). Copy link
 * sits at the row's end, on every level and in both modes (owner, 2026-11-06).
 */
export function ScopeTitle() {
  const t = useTranslations('overview');
  const tDrill = useTranslations('drill');
  const format = useFormatter();
  const { ds, state } = useDashboard();
  const scopeLabel = useScopeLabel();
  const title = scopeLabel(ds, state.scope) ?? tDrill('portfolio');
  const analyst = state.mode === 'analyst';
  const ModeIcon = analyst ? MicroscopeIcon : LayoutDashboardIcon;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
              analyst ? 'bg-foreground text-background' : 'bg-muted text-foreground',
            )}
          >
            <ModeIcon aria-hidden className="size-3.5" />
            {t(`modeBadge.${state.mode}`)}
          </span>
        </div>
        {/* Read out when the mode changes; the badge says the same words. */}
        <p aria-live="polite" className="text-sm">
          {t(`modeNote.${state.mode}`)}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('summary', {
            markets: marketsInScope(ds, state.scope).length,
            products: state.scope.productId ? 1 : ds.products.length,
            period: format.dateTime(periodToDate(ds.meta.latestPeriod), 'period'),
          })}
        </p>
      </div>
      <CopyLinkButton />
    </div>
  );
}

export function ScopeTitleSkeleton() {
  return (
    <div aria-hidden className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <CopyLinkButtonSkeleton />
    </div>
  );
}
