import { screen } from '@testing-library/react';
import { useFormatter } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { renderWithProviders } from '@/shared/lib/test';

import { CurrencySwitch, CurrencySwitchRow } from './CurrencySwitch';

const t = en.currency;

/** An amount in the formats the app provides, to see the switch reach them. */
function Amount() {
  return <output>{useFormatter().number(1000, 'currency')}</output>;
}

describe('CurrencySwitch', () => {
  afterEach(() => {
    localStorage.clear();
  });

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

  it('switches every amount and remembers the choice in this browser', async () => {
    const { user } = renderWithProviders(
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
    expect(localStorage.getItem('mo:currency')).toBe('GBP');
  });

  it('reads a stored choice; an unknown one falls back to USD', () => {
    localStorage.setItem('mo:currency', 'JPY');
    renderWithProviders(<CurrencySwitch />);
    expect(screen.getByRole('button', { name: 'Currency: USD, US dollar' })).toHaveTextContent(
      'USD',
    );
  });

  it('settings row: shows the code and the name', () => {
    localStorage.setItem('mo:currency', 'EUR');
    renderWithProviders(<CurrencySwitchRow />);
    expect(screen.getByRole('button')).toHaveTextContent(`${t.label} EUR · Euro`);
  });
});
