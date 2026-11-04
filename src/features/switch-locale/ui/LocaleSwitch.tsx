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

/** The language menu; `children` is its trigger. */
function LocaleMenu({ children }: { children: ReactNode }) {
  const t = useTranslations('locale');
  const current = useLocale();
  const switchLocale = useSwitchLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            const locale = routing.locales.find((l): l is AppLocale => l === value);
            if (locale) switchLocale(locale);
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

/** Settings sheet: the whole row opens the menu and shows the current language. */
export function LocaleSwitchRow({ className }: { className?: string }) {
  const t = useTranslations('locale');
  const current = useLocale();
  const name = routing.locales.find((l) => l === current);
  return (
    <LocaleMenu>
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
