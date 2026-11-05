import { screen, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { ComparisonRadar } from './ComparisonRadar';

const t = en.radar;

function setup(searchParams = '?mode=analyst') {
  return renderWithProviders(
    <Suspense>
      <ComparisonRadar />
    </Suspense>,
    { searchParams },
  );
}

const legend = () => screen.findByRole('list', { name: t.legend });

describe('ComparisonRadar', () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(datasetHandler());
  });

  it('nothing selected: the four regions and the portfolio, each with its own line pattern', async () => {
    setup();
    expect(await screen.findByRole('region', { name: t.title })).toBeInTheDocument();
    expect(screen.getByText(t.basis.regions)).toBeInTheDocument();
    const items = within(await legend()).getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual([
      'North America',
      'Europe',
      'APAC',
      'LATAM',
      t.portfolio,
    ]);
    // A drawn sample per series, not colour alone: every dash pattern differs.
    const dashes = items.map((i) => i.querySelector('line')?.getAttribute('stroke-dasharray'));
    expect(new Set(dashes).size).toBe(5);
    expect(screen.getByText(t.pickHint)).toBeInTheDocument();
  });

  it('selected markets, with real values in the table', async () => {
    const { user } = setup('?mode=analyst&markets=de&markets=es');
    expect(await screen.findByText(t.basis.selection)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.showTable }));
    const table = await screen.findByRole('table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual([t.compared, ...Object.values(t.axis)]);
    const germany = within(table).getByRole('row', { name: /Germany/ });
    expect(germany).toHaveTextContent('-9.7%');
    expect(germany).toHaveTextContent('-11.8 pp');
    expect(within(table).getByRole('row', { name: new RegExp(t.portfolio) })).toBeInTheDocument();
  });

  it('five selected: the first four, and says so', async () => {
    setup('?mode=analyst&markets=jp&markets=de&markets=es&markets=fr&markets=it');
    expect(
      await screen.findByText('Showing the first 4 of 5 selected markets.'),
    ).toBeInTheDocument();
    expect(within(await legend()).getAllByRole('listitem')).toHaveLength(5);
  });

  it('a market opened on the map: it and its neighbours, not the regions', async () => {
    setup('?mode=analyst&region=eu&market=gb');
    expect(
      await screen.findByText('United Kingdom and its neighbours in Europe, against the portfolio'),
    ).toBeInTheDocument();
    const items = within(await legend()).getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual([
      'United Kingdom',
      'France',
      'Germany',
      'Italy',
      t.portfolio,
    ]);
    expect(screen.getByText('Showing 4 of 5 markets of Europe.')).toBeInTheDocument();
    expect(screen.getByText(t.pickHint)).toBeInTheDocument();
  });

  it('a 3-month window leaves share out, with the reason', async () => {
    setup('?mode=analyst&range=3m');
    expect(await screen.findByText(t.removed.shareLatestOnly)).toBeInTheDocument();
  });

  it('an open product does not apply to the radar, and says so', async () => {
    setup('?mode=analyst&region=eu&market=de&product=veltrix');
    expect(
      await screen.findByText('Compares markets, not products: Veltrix is not applied here.'),
    ).toBeInTheDocument();
  });

  it('the table choice is remembered', async () => {
    const { user, unmount } = setup();
    await user.click(await screen.findByRole('button', { name: t.showTable }));
    unmount();
    setup();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.showChart })).toBeInTheDocument();
  });
});
