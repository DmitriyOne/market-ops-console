'use client';

import { LanguagesIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

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

export function LocaleSwitch() {
  const t = useTranslations('locale');
  const current = useLocale();
  const switchLocale = useSwitchLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('label')}>
          <LanguagesIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
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
