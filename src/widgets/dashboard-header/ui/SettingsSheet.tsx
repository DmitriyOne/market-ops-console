'use client';

import { RotateCcwIcon, SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';

import { ResetViewLink } from '@/features/reset-view';
import { LocaleSwitch } from '@/features/switch-locale';
import { ThemeSwitch } from '@/features/switch-theme';
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

/** Phones: language, theme and reset behind one ⚙︎ button (spec §6 Layout). */
export function SettingsSheet({ className }: { className?: string }) {
  const t = useTranslations('header');
  const tLocale = useTranslations('locale');
  const tTheme = useTranslations('theme');
  const [open, setOpen] = useState(false);
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
          <div className="flex min-h-11 items-center justify-between">
            <span>{tLocale('label')}</span>
            {/* Reads search params, which static HTML does not have. */}
            <Suspense>
              <LocaleSwitch />
            </Suspense>
          </div>
          <div className="flex min-h-11 items-center justify-between">
            <span>{tTheme('label')}</span>
            <ThemeSwitch />
          </div>
          {/* Reads search params, which static HTML does not have. */}
          <Suspense>
            <ResetViewLink
              className="flex min-h-11 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onReset={() => {
                setOpen(false);
              }}
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
