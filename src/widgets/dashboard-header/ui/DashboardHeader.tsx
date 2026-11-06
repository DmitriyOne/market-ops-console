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
import { cn, CONTROLS_ROW_ATTR } from '@/shared/lib';
import { Logo, Skeleton } from '@/shared/ui';

import { AlertsButton } from './AlertsButton';
import { DrillBreadcrumbs } from './DrillBreadcrumbs';
import { SettingsSheet } from './SettingsSheet';

const ROW = 'flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2';
// Phone: period and mode share one row over the top of the dashboard (it
// starts `controls` lower), so the header itself stays two rows. Scrolling
// down slides the row away, without moving anything else (no layout shift);
// up, or focus inside it, brings it back (owner, 2026-11-06). The shell keeps
// that one state: no CSS `focus-within` here, which kept a hidden row on
// screen until focus left for a menu, and then slid it away with the menu.
const CONTROLS = cn(
  'flex items-center gap-2',
  'max-lg:absolute max-lg:inset-x-0 max-lg:top-full max-lg:h-controls max-lg:border-b max-lg:border-border max-lg:bg-background max-lg:px-4',
  'max-lg:transition-[translate,opacity] max-lg:duration-200 motion-reduce:transition-none',
  'max-lg:controls-hidden:pointer-events-none max-lg:controls-hidden:-translate-y-full max-lg:controls-hidden:opacity-0',
);

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
      <span className="sr-only">{t('srAfter', { text: tHeader('resetView') })}</span>
    </ResetViewLink>
  );
}

/**
 * Desktop: name · path · period · mode · alerts · currency · language · theme in one row.
 * Phone: name and ⚙︎ on the first row, the path below; period and mode
 * in one row over the dashboard's top, which slides away while scrolling down.
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
        <div className={CONTROLS} {...{ [CONTROLS_ROW_ATTR]: '' }}>
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
      <PathSkeleton />
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
