'use client';

import { RotateCcwIcon, SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';

import { ResetViewLink } from '@/features/reset-view';
import { CurrencySwitchRow } from '@/features/switch-currency';
import { LocaleSwitchRow } from '@/features/switch-locale';
import { ThemeSwitchRow } from '@/features/switch-theme';
import { cn } from '@/shared/lib';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui';

// A whole row is the target, not a small icon at its end.
const ROW =
  '-mx-2 flex min-h-12 items-center justify-between gap-3 rounded-md px-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50';

/** Phones: language, currency, theme and reset behind one ⚙︎ button (spec §6 Layout). */
export function SettingsSheet({ className }: { className?: string }) {
  const t = useTranslations('header');
  const [open, setOpen] = useState(false);
  // A pick in any of its menus is the whole errand: the sheet closes with it.
  const close = () => {
    setOpen(false);
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('size-11', className)}
          aria-label={t('settings')}
        >
          <SettingsIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="pb-6">
        <SheetHeader>
          <SheetTitle>{t('settingsTitle')}</SheetTitle>
          <SheetDescription className="sr-only">{t('settings')}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4">
          {/* Reads search params, which static HTML does not have. */}
          <Suspense>
            <LocaleSwitchRow className={ROW} onPick={close} />
          </Suspense>
          <CurrencySwitchRow className={ROW} onPick={close} />
          <ThemeSwitchRow className={ROW} onPick={close} />
          {/* Reads search params, which static HTML does not have. */}
          <Suspense>
            <ResetViewLink
              className="-mx-2 flex min-h-12 items-center gap-3 rounded-md px-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              onReset={close}
            >
              <RotateCcwIcon aria-hidden className="size-4 shrink-0" />
              <span className="flex flex-col">
                <span>{t('resetView')}</span>
                <span className="text-xs text-muted-foreground">{t('resetHint')}</span>
              </span>
            </ResetViewLink>
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}
