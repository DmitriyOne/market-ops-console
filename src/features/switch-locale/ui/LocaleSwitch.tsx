'use client';

import { ChevronRightIcon, LanguagesIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { type AppLocale, routing } from '@/shared/config';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui';

import { useSwitchLocale } from '../model/use-switch-locale';

/** The language menu; `children` is its trigger, `onPick` runs after a choice (the sheet closes). */
function LocaleMenu({
  children,
  onPick,
  side = 'bottom',
}: {
  children: ReactNode;
  onPick?: () => void;
  /**
   * `top` in the settings sheet: it is pinned to the bottom, so there is room
   * above. Below, a long menu fits only until the sheet starts closing after a
   * pick; then it flips above mid-fade, a flash 200 px away (owner, 2026-11-06).
   */
  side?: 'top' | 'bottom';
}) {
  const t = useTranslations('locale');
  const current = useLocale();
  const switchLocale = useSwitchLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            const locale = routing.locales.find((l): l is AppLocale => l === value);
            if (locale) switchLocale(locale);
            onPick?.();
          }}
        >
          {routing.locales.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale} lang={locale}>
              {t(locale)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Header: an icon button. */
export function LocaleSwitch() {
  const t = useTranslations('locale');
  return (
    <LocaleMenu>
      <Button variant="ghost" size="icon" aria-label={t('label')}>
        <LanguagesIcon aria-hidden />
      </Button>
    </LocaleMenu>
  );
}

/** Settings sheet: the whole row opens the menu and shows the current language; `onPick` closes the sheet. */
export function LocaleSwitchRow({
  className,
  onPick,
}: {
  className?: string;
  onPick?: () => void;
}) {
  const t = useTranslations('locale');
  const current = useLocale();
  const name = routing.locales.find((l) => l === current);
  return (
    <LocaleMenu onPick={onPick} side="top">
      <button type="button" className={className}>
        <span>{t('label')}</span>{' '}
        <span className="flex items-center gap-1 text-muted-foreground">
          {name ? t(name) : null}
          <ChevronRightIcon aria-hidden className="size-4" />
        </span>
      </button>
    </LocaleMenu>
  );
}
