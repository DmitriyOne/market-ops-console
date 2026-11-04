'use client';

import { SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

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

/** Phones: language and theme behind one ⚙︎ button (spec §6 Layout). */
export function SettingsSheet({ className }: { className?: string }) {
  const t = useTranslations('header');
  const tLocale = useTranslations('locale');
  const tTheme = useTranslations('theme');
  return (
    <Sheet>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
