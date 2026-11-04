import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { MarketStatus } from './MarketStatus';

const t = en.marketStatus;

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <MarketStatus />
    </Suspense>,
    { searchParams },
  );
}

describe('MarketStatus', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('one tile per market, named with status and attainment', async () => {
    setup();
    const section = await screen.findByRole('region', { name: t.title });
    expect(within(section).getAllByRole('button', { name: /attainment/ })).toHaveLength(13);
    expect(
      within(section).getByRole('button', { name: 'DE Germany, Off track, attainment 92.0%' }),
    ).toBeInTheDocument();
  });

  it('legend counts each status by shape and word', async () => {
    setup();
    const section = await screen.findByRole('region', { name: t.title });
    expect(
      within(section)
        .getByText(/On track/)
        .closest('li'),
    ).toHaveTextContent('7');
    expect(
      within(section)
        .getByText(/^At risk/)
        .closest('li'),
    ).toHaveTextContent('4');
    expect(
      within(section)
        .getByText(/^Off track/)
        .closest('li'),
    ).toHaveTextContent('2');
  });

  it('clicking a tile drills into that market', async () => {
    const { user, lastUpdate } = setup('?period=2026-05');
    await user.click(await screen.findByRole('button', { name: /^DE Germany,/ }));
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toMatchObject({
        region: 'eu',
        market: 'de',
      });
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });

  it('markets listed by the assistant are marked in the name, not by colour alone', async () => {
    setup('?markets=es&markets=fr');
    expect(
      await screen.findByRole('button', {
        name: 'ES Spain, Off track, attainment 104.5% · highlighted from the assistant',
      }),
    ).toBeInTheDocument();
  });

  it('off the latest month: no status anywhere, a notice instead', async () => {
    setup('?period=2026-03');
    expect(await screen.findByText(t.latestOnly)).toBeInTheDocument();
    expect(screen.queryByText(/Off track|At risk|On track/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^DE Germany, attainment/ })).toBeInTheDocument();
  });

  it('with a product chosen, the card says the tiles are whole markets', async () => {
    setup('?region=eu&market=de&product=veltrix');
    expect(await screen.findByText(t.perMarket)).toBeInTheDocument();
  });

  it('the table caption names the window, not just a month', async () => {
    const { user } = setup('?period=2026-03&range=3m');
    await user.click(await screen.findByRole('button', { name: t.showTable }));
    expect(
      screen.getByRole('table', { name: 'Market status by region, Mar 2026 · 3 months' }),
    ).toBeInTheDocument();
  });

  it('a region shows only its markets', async () => {
    setup('?region=apac');
    const section = await screen.findByRole('region', { name: t.title });
    expect(within(section).getAllByRole('button', { name: /attainment/ })).toHaveLength(4);
  });

  it('"Show as table" gives the same facts as a table', async () => {
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: t.showTable }));
    const table = screen.getByRole('table', { name: 'Market status by region, May 2026' });
    const germany = within(table).getByRole('row', { name: /Germany/ });
    expect(germany).toHaveTextContent('Europe');
    expect(germany).toHaveTextContent('92.0%');
    expect(germany).toHaveTextContent('Off track');
    expect(within(table).getAllByRole('row')).toHaveLength(14);
    expect(screen.getByRole('button', { name: t.showTable })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('button', { name: /^DE Germany,/ })).not.toBeInTheDocument();
  });
});
