'use client';

import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { DatasetGate } from '@/entities/performance';
import { ResetViewLink } from '@/features/reset-view';
import { PeriodPicker } from '@/features/select-period';
import { CurrencySwitch } from '@/features/switch-currency';
import { LocaleSwitch } from '@/features/switch-locale';
import { ModeSwitch } from '@/features/switch-mode';
import { ThemeSwitch } from '@/features/switch-theme';
import { cn } from '@/shared/lib';
import { Logo, Skeleton } from '@/shared/ui';

import { AlertsButton } from './AlertsButton';
import { SettingsSheet } from './SettingsSheet';

const ROW = 'flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2';
// Phone: period and mode share the second row, half the width each.
const CONTROLS = 'flex items-center gap-2 max-lg:order-1 max-lg:w-full';

// The name fills the row up to the controls (phone: up to ⚙︎). The drill-down
// path is on the page, above the title (owner, 2026-11-06).
const APP_NAME = 'flex flex-1 items-center gap-2 font-semibold whitespace-nowrap';

/** The logo and the app name; live, they lead back to the clean dashboard. */
function AppName({ live = false }: { live?: boolean }) {
  const t = useTranslations('common');
  const tHeader = useTranslations('header');
  if (!live) {
    return (
      <span className={APP_NAME}>
        <Logo />
        {t('appName')}
      </span>
    );
  }
  return (
    <ResetViewLink
      className={cn(
        APP_NAME,
        'min-h-11 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50',
      )}
    >
      <Logo />
      {t('appName')}
      <span className="sr-only">{t('srAfter', { text: tHeader('resetView') })}</span>
    </ResetViewLink>
  );
}

/**
 * Desktop: name · period · mode · alerts · currency · language · theme in one row.
 * Phone: name and ⚙︎ on the first row, then period and mode side by side.
 */
export function DashboardHeader() {
  return (
    <div className={ROW}>
      {/* Reads search params, which static HTML does not have. */}
      <Suspense fallback={<AppName />}>
        <AppName live />
      </Suspense>
      <SettingsSheet className="lg:hidden" />
      {/* The period needs the dataset: it waits with a skeleton, and if it
          fails it steps aside (the page says so once, ADR 0013). */}
      <DatasetGate fallback={null}>
        <div className={CONTROLS}>
          <Suspense fallback={<ControlsSkeleton />}>
            <PeriodPicker className="max-lg:min-w-0 max-lg:flex-1 max-lg:basis-0" />
            <ModeSwitch className="max-lg:flex-1 max-lg:basis-0" />
          </Suspense>
        </div>
      </DatasetGate>
      <div className="flex items-center gap-1 max-lg:hidden">
        {/* Reads search params, which static HTML does not have. Phones
            reach alerts from the tab bar. */}
        <Suspense fallback={<Skeleton aria-hidden className="size-11" />}>
          <AlertsButton />
        </Suspense>
        <CurrencySwitch />
        <Suspense>
          <LocaleSwitch />
        </Suspense>
        <ThemeSwitch />
      </div>
    </div>
  );
}

function ControlsSkeleton() {
  return (
    <>
      <Skeleton aria-hidden className="h-11 w-48 max-lg:min-w-0 max-lg:flex-1 max-lg:basis-0" />
      <Skeleton
        aria-hidden
        className="h-13 w-52 shrink-0 rounded-xl max-lg:w-auto max-lg:flex-1 max-lg:basis-0"
      />
    </>
  );
}

/** The same row before the URL is read (static HTML): nothing moves when it arrives. */
export function DashboardHeaderSkeleton() {
  return (
    <div className={ROW} aria-hidden>
      <AppName />
      <Skeleton className="size-11 lg:hidden" />
      <div className={CONTROLS}>
        <ControlsSkeleton />
      </div>
      <div className="flex items-center gap-1 max-lg:hidden">
        <Skeleton className="size-11" />
        <Skeleton className="h-8 min-w-16" />
        <Skeleton className="size-9" />
        <Skeleton className="size-9" />
      </div>
    </div>
  );
}
