'use client';

import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { PeriodPicker } from '@/features/select-period';
import { LocaleSwitch } from '@/features/switch-locale';
import { ModeSwitch } from '@/features/switch-mode';
import { ThemeSwitch } from '@/features/switch-theme';
import { Skeleton } from '@/shared/ui';

import { DrillBreadcrumbs } from './DrillBreadcrumbs';
import { SettingsSheet } from './SettingsSheet';

const ROW = 'flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2';
// Phone: period and mode each take a full row, so nothing runs off the screen.
const CONTROLS = 'flex items-center gap-2 max-lg:w-full max-lg:flex-col max-lg:items-stretch';

function AppName() {
  const t = useTranslations('common');
  return <span className="font-semibold whitespace-nowrap max-lg:hidden">{t('appName')}</span>;
}

/**
 * Desktop: name · path · period · mode · language · theme in one row.
 * Phone: path and ⚙︎ on the first row, period and mode full width below.
 */
export function DashboardHeader() {
  return (
    <div className={ROW}>
      <AppName />
      <DrillBreadcrumbs className="min-w-0 flex-1" />
      <SettingsSheet className="lg:hidden" />
      <div className={CONTROLS}>
        <PeriodPicker />
        <ModeSwitch className="max-lg:w-full" />
      </div>
      <div className="flex items-center gap-1 max-lg:hidden">
        {/* Reads search params, which static HTML does not have. */}
        <Suspense>
          <LocaleSwitch />
        </Suspense>
        <ThemeSwitch />
      </div>
    </div>
  );
}

/** The same row before the URL is read (static HTML): nothing moves when it arrives. */
export function DashboardHeaderSkeleton() {
  return (
    <div className={ROW} aria-hidden>
      <AppName />
      <div className="flex min-h-11 min-w-0 flex-1 items-center">
        <Skeleton className="h-5 w-44" />
      </div>
      <Skeleton className="size-11 lg:hidden" />
      <div className={CONTROLS}>
        <Skeleton className="h-11 w-48 max-lg:w-full" />
        <Skeleton className="h-11 w-44 max-lg:w-full" />
      </div>
      <div className="flex items-center gap-1 max-lg:hidden">
        <Skeleton className="size-9" />
        <Skeleton className="size-9" />
      </div>
    </div>
  );
}
