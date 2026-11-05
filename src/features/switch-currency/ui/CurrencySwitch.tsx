'use client';

import { ChevronRightIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ReactNode, useId } from 'react';

import { CURRENCIES, CURRENCY_SYMBOLS, RATES_DATE, USD_RATES } from '@/shared/config';
import { useCurrencyChoice } from '@/shared/lib';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

/** The currency menu: the choices, then the rates' date and source. `children` is its trigger. */
function CurrencyMenu({ children }: { children: ReactNode }) {
  const t = useTranslations('currency');
  const format = useFormatter();
  const [currency, setCurrency] = useCurrencyChoice();
  const noteId = useId();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72" aria-describedby={noteId}>
        <DropdownMenuRadioGroup
          value={currency ?? undefined}
          onValueChange={(value) => {
            const choice = CURRENCIES.find((c) => c === value);
            if (choice) setCurrency(choice);
          }}
        >
          {CURRENCIES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code}>
              <span aria-hidden className="w-3 text-center">
                {CURRENCY_SYMBOLS[code]}
              </span>
              <span className="font-medium">{code}</span>
              <span className="text-muted-foreground">{t(code)}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel id={noteId} className="font-normal">
          {t('rates', {
            date: format.dateTime(new Date(`${RATES_DATE}T00:00:00Z`), 'day'),
            eur: format.number(USD_RATES.EUR, 'rate'),
            gbp: format.number(USD_RATES.GBP, 'rate'),
          })}{' '}
          {t('demo')}
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Header: the code of the current currency ("USD"); waits until the browser is read. */
export function CurrencySwitch() {
  const t = useTranslations('currency');
  const [currency] = useCurrencyChoice();
  return (
    <CurrencyMenu>
      <Button
        variant="ghost"
        className="min-w-16"
        aria-label={currency ? t('current', { code: currency, name: t(currency) }) : t('label')}
        disabled={currency === null}
      >
        {currency ?? CURRENCIES[0]}
      </Button>
    </CurrencyMenu>
  );
}

/** Settings sheet: the whole row opens the menu and shows the current currency. */
export function CurrencySwitchRow({ className }: { className?: string }) {
  const t = useTranslations('currency');
  const [currency] = useCurrencyChoice();
  return (
    <CurrencyMenu>
      <button type="button" className={className} disabled={currency === null}>
        <span>{t('label')}</span>{' '}
        <span className="flex items-center gap-1 text-muted-foreground">
          {currency ? `${currency} · ${t(currency)}` : null}
          <ChevronRightIcon aria-hidden className="size-4" />
        </span>
      </button>
    </CurrencyMenu>
  );
}
