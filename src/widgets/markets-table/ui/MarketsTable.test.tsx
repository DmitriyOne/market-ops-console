import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

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
    server.use(datasetHandler());
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
    expect(germany).toHaveTextContent('92.0%');
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
    expect(await firstMarket()).toBe('China');
    await user.click(screen.getByRole('button', { name: t.column.growth }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&sort=growth');
    });
    expect(await firstMarket()).toBe('Germany');
  });

  it('text columns start ascending', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await screen.findByRole('button', { name: t.column.market }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&sort=market');
    });
    expect(await firstMarket()).toBe('Australia');
  });

  it('the selection narrows the rows and the total', async () => {
    setup('?mode=analyst&markets=de&markets=es');
    expect(await bodyRows()).toHaveLength(2);
    // Filter, count and Clear on one row; the chips on the row below.
    const count = screen.getByText('2 of 13 selected');
    const chip = screen.getByRole('button', { name: 'Remove Germany' });
    expect(count.parentElement).toContainElement(
      screen.getByRole('button', { name: en.marketFilter.clear }),
    );
    expect(count.parentElement).not.toContainElement(chip);
  });

  it('selected markets outside the scope: an empty state with Clear', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&region=apac&markets=de');
    expect(await screen.findByText(t.empty)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: en.marketFilter.clear }));
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
    await user.click(screen.getByRole('button', { name: 'Germany' }));
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
});
