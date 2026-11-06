import { screen } from '@testing-library/react';
import { useFormatter } from 'next-intl';
import { describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { renderWithProviders } from '@/shared/lib/test';

import { CurrencySwitch, CurrencySwitchRow } from './CurrencySwitch';

const t = en.currency;

/** An amount in the formats the app provides, to see the switch reach them. */
function Amount() {
  return <output>{useFormatter().number(1000, 'currency')}</output>;
}

describe('CurrencySwitch', () => {
  it('offers USD, EUR and GBP with their names, and says where the rates come from', async () => {
    const { user } = renderWithProviders(<CurrencySwitch />);
    await user.click(screen.getByRole('button', { name: 'Currency: USD, US dollar' }));
    expect(screen.getAllByRole('menuitemradio').map((i) => i.textContent)).toEqual([
      '$USDUS dollar',
      '€EUREuro',
      '£GBPBritish pound',
    ]);
    expect(screen.getByRole('menuitemradio', { name: /USD/ })).toBeChecked();
    expect(screen.getByRole('menu')).toHaveAccessibleDescription(
      `ECB rates of 5 November 2026: 1 USD = 0.89095 EUR = 0.74299 GBP. ${t.demo}`,
    );
  });

  it('switches every amount and writes the choice to the URL (replace)', async () => {
    const { user, lastUpdate } = renderWithProviders(
      <>
        <CurrencySwitch />
        <Amount />
      </>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('$1,000.00');

    await user.click(screen.getByRole('button', { name: 'Currency: USD, US dollar' }));
    await user.click(screen.getByRole('menuitemradio', { name: /GBP/ }));

    expect(screen.getByRole('button', { name: 'Currency: GBP, British pound' })).toHaveTextContent(
      'GBP',
    );
    expect(screen.getByRole('status')).toHaveTextContent('£1,000.00');
    expect(lastUpdate()?.searchParams.get('currency')).toBe('GBP');
    expect(lastUpdate()?.options.history).toBe('replace');
  });

  it('back to USD removes it from the URL', async () => {
    const { user, lastUpdate } = renderWithProviders(<CurrencySwitch />, {
      searchParams: '?currency=EUR',
    });
    await user.click(screen.getByRole('button', { name: 'Currency: EUR, Euro' }));
    await user.click(screen.getByRole('menuitemradio', { name: /USD/ }));
    expect(lastUpdate()?.searchParams.has('currency')).toBe(false);
  });

  it('reads the URL; an unknown currency falls back to USD', () => {
    renderWithProviders(<CurrencySwitch />, { searchParams: '?currency=JPY' });
    expect(screen.getByRole('button', { name: 'Currency: USD, US dollar' })).toHaveTextContent(
      'USD',
    );
  });

  it('settings row: shows the code and the name', () => {
    renderWithProviders(<CurrencySwitchRow />, { searchParams: '?currency=EUR' });
    expect(screen.getByRole('button')).toHaveTextContent(`${t.label} EUR · Euro`);
  });
});
