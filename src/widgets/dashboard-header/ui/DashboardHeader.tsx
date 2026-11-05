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
import { DrillBreadcrumbs } from './DrillBreadcrumbs';
import { SettingsSheet } from './SettingsSheet';

const ROW = 'flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2';
// Phone: period and mode each take a full row, so nothing runs off the screen.
const CONTROLS =
  'flex items-center gap-2 max-lg:order-2 max-lg:w-full max-lg:flex-col max-lg:items-stretch';

// Phone: the name fills the first row next to ⚙︎; the path drops to its own row.
const APP_NAME = 'flex items-center gap-2 font-semibold whitespace-nowrap max-lg:flex-1';
const PATH = 'min-w-0 flex-1 max-lg:order-1 max-lg:basis-full';

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
      <span className="sr-only">{`, ${tHeader('resetView')}`}</span>
    </ResetViewLink>
  );
}

/**
 * Desktop: name · path · period · mode · alerts · currency · language · theme in one row.
 * Phone: name and ⚙︎ on the first row, the path below, then period and
 * mode full width.
 */
export function DashboardHeader() {
  return (
    <div className={ROW}>
      {/* Reads search params, which static HTML does not have. */}
      <Suspense fallback={<AppName />}>
        <AppName live />
      </Suspense>
      {/* The path and period need the dataset: they wait with a skeleton, and
          if it fails they step aside (the page says so once, ADR 0013). */}
      <DatasetGate fallback={<div className={PATH} />}>
        <Suspense fallback={<PathSkeleton />}>
          <DrillBreadcrumbs className={PATH} />
        </Suspense>
      </DatasetGate>
      <SettingsSheet className="lg:hidden" />
      <DatasetGate fallback={null}>
        <div className={CONTROLS}>
          <Suspense fallback={<ControlsSkeleton />}>
            <PeriodPicker />
            <ModeSwitch className="max-lg:w-full" />
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

function PathSkeleton() {
  return (
    <div aria-hidden className={cn('flex min-h-11 items-center', PATH)}>
      <Skeleton className="h-5 w-44" />
    </div>
  );
}

function ControlsSkeleton() {
  return (
    <>
      <Skeleton aria-hidden className="h-11 w-48 max-lg:w-full" />
      <Skeleton aria-hidden className="h-13 w-52 rounded-xl max-lg:w-full" />
    </>
  );
}

/** The same row before the URL is read (static HTML): nothing moves when it arrives. */
export function DashboardHeaderSkeleton() {
  return (
    <div className={ROW} aria-hidden>
      <AppName />
      <PathSkeleton />
      <Skeleton className="size-11 lg:hidden" />
      <div className={CONTROLS}>
        <ControlsSkeleton />
      </div>
      <div className="flex items-center gap-1 max-lg:hidden">
        <Skeleton className="size-11" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="size-9" />
        <Skeleton className="size-9" />
      </div>
    </div>
  );
}
