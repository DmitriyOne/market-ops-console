'use client';

import { ChevronRightIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ReactNode, useId } from 'react';

import { CURRENCIES, CURRENCY_SYMBOLS, isCurrency, RATES_DATE, USD_RATES } from '@/shared/config';
import { useCurrencyChoice, useJoinParts } from '@/shared/lib';
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

/**
 * The currency menu: the choices, then the rates' date and source.
 * `children` is its trigger; `onPick` runs after a choice (the sheet closes).
 */
function CurrencyMenu({
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
  const t = useTranslations('currency');
  const format = useFormatter();
  const [currency, setCurrency] = useCurrencyChoice();
  const noteId = useId();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="min-w-72" aria-describedby={noteId}>
        <DropdownMenuRadioGroup
          value={currency}
          onValueChange={(value) => {
            if (isCurrency(value)) setCurrency(value);
            onPick?.();
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

/** Header: the code of the current currency ("USD"). */
export function CurrencySwitch() {
  const t = useTranslations('currency');
  const [currency] = useCurrencyChoice();
  return (
    <CurrencyMenu>
      <Button
        variant="ghost"
        className="min-w-16"
        aria-label={t('current', { code: currency, name: t(currency) })}
      >
        {currency}
      </Button>
    </CurrencyMenu>
  );
}

/** Settings sheet: the whole row opens the menu and shows the current currency; `onPick` closes the sheet. */
export function CurrencySwitchRow({
  className,
  onPick,
}: {
  className?: string;
  onPick?: () => void;
}) {
  const t = useTranslations('currency');
  const join = useJoinParts();
  const [currency] = useCurrencyChoice();
  return (
    <CurrencyMenu onPick={onPick} side="top">
      <button type="button" className={className}>
        <span>{t('label')}</span>{' '}
        <span className="flex items-center gap-1 text-muted-foreground">
          {join([currency, t(currency)])}
          <ChevronRightIcon aria-hidden className="size-4" />
        </span>
      </button>
    </CurrencyMenu>
  );
}
