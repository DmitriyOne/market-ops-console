import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { alertsApi, datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { MarketsTable } from './MarketsTable';

const t = en.marketsTable;

function setup(searchParams = '?mode=analyst') {
  return renderWithProviders(
    <Suspense>
      <MarketsTable />
    </Suspense>,
    { searchParams },
  );
}

const table = () => screen.findByRole('table');
const bodyRows = async () =>
  within((await table()).querySelector('tbody') ?? document.body).getAllByRole('row');
const firstMarket = async () =>
  within((await bodyRows())[0] ?? document.body).getAllByRole('cell')[0]?.textContent;

describe('MarketsTable', () => {
  beforeEach(() => {
    server.use(datasetHandler(), ...alertsApi([]).handlers);
  });

  it('a market the alert rules flag has a bell naming the rules', async () => {
    const api = alertsApi();
    server.use(...api.handlers);
    setup();
    const bell = await screen.findByRole('button', {
      name: 'Critical alert: Attainment below 95% and Share below 10%',
    });
    expect(
      within(screen.getByRole('row', { name: /Germany/ })).getByRole('button', {
        name: /Critical alert/,
      }),
    ).toBe(bell);
    // United States and Australia: the share rule only.
    expect(screen.getAllByRole('button', { name: 'Alert: Share below 10%' })).toHaveLength(2);
    expect(
      within(screen.getByRole('row', { name: /Spain/ })).queryByRole('button', { name: /alert/i }),
    ).not.toBeInTheDocument();
  });

  it('every market of the portfolio with all KPIs, and a total row', async () => {
    setup();
    expect(await screen.findByRole('region', { name: t.title })).toBeInTheDocument();
    expect(await bodyRows()).toHaveLength(13);
    for (const name of Object.values(t.column)) {
      expect(screen.getByRole('columnheader', { name: new RegExp(name) })).toBeInTheDocument();
    }
    const germany = screen.getByRole('row', { name: /Germany/ });
    expect(germany).toHaveTextContent('-9.7%');
    expect(germany).toHaveTextContent('92.2%');
    expect(germany).toHaveTextContent('Off track');
    expect(screen.getByRole('button', { name: en.exportMarkets.button })).toBeEnabled();
    const total = within((await table()).querySelector('tfoot') ?? document.body).getByRole('row');
    expect(total).toHaveTextContent(t.total);
  });

  it('a header sorts descending, then ascending, without a history entry', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await screen.findByRole('button', { name: t.column.growth }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&sort=-growth');
    });
    expect(lastUpdate()?.options.history).toBe('replace');
    expect(screen.getByRole('columnheader', { name: t.column.growth })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(await firstMarket()).toBe('CN China');
    await user.click(screen.getByRole('button', { name: t.column.growth }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&sort=growth');
    });
    expect(await firstMarket()).toBe('DE Germany');
  });

  it('text columns start ascending', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await screen.findByRole('button', { name: t.column.market }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&sort=market');
    });
    expect(await firstMarket()).toBe('AU Australia');
  });

  it('the selection narrows the rows and the total', async () => {
    setup('?mode=analyst&markets=de&markets=es');
    expect(await bodyRows()).toHaveLength(2);
    // The filter and its count on one row; the chips on the row below.
    const count = screen.getByText('2 of 13 selected');
    const chip = screen.getByRole('button', { name: 'Remove Germany' });
    expect(count.parentElement).toContainElement(screen.getByRole('button', { name: /^Markets/ }));
    expect(count.parentElement).not.toContainElement(chip);
  });

  it('selected markets outside the scope: an empty state with Clear', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&region=apac&markets=de');
    expect(await screen.findByText(t.empty)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Markets/ }));
    await user.click(await screen.findByRole('menuitem', { name: en.marketFilter.clearAll }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&region=apac');
    });
    expect(await bodyRows()).toHaveLength(4);
  });

  it('a 3-month window: no status, one note', async () => {
    setup('?mode=analyst&range=3m');
    const germany = await screen.findByRole('row', { name: /Germany/ });
    expect(germany).not.toHaveTextContent('Off track');
    expect(screen.getAllByText(t.noteLatest)).toHaveLength(1);
  });

  it('a market name drills in; the open market is marked', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&region=eu&market=fr');
    expect(await screen.findByRole('row', { name: /France/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'DE Germany' }));
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toMatchObject({ market: 'de' });
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });

  it('the caption names the scope and the window', async () => {
    setup('?mode=analyst&region=eu&range=3m&period=2026-03');
    const caption = (await table()).querySelector('caption');
    expect(caption).toHaveTextContent('Europe');
    expect(caption).toHaveTextContent('3 months');
  });

  it('forecast and prior year columns; the anomaly in the window is marked with its note', async () => {
    setup('?mode=analyst&period=2026-03');
    expect(
      await screen.findByRole('columnheader', { name: t.column.forecast }),
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: t.column.priorYear })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Anomaly, Mar 2026: Revenue fell 27% versus the prior month.',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Anomaly/ })).toHaveLength(1);
  });
});
