import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { TopRisks } from './TopRisks';

const t = en.topRisks;

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <TopRisks />
    </Suspense>,
    { searchParams },
  );
}

describe('TopRisks', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('lists the six non-on-track markets, off track first then by attainment', async () => {
    setup();
    const section = await screen.findByRole('region', { name: t.title });
    const rows = within(section).getAllByRole('listitem');
    const order = ['Germany', 'Spain', 'Italy', 'United Kingdom', 'Brazil', 'France'];
    expect(rows).toHaveLength(order.length);
    rows.forEach((row, i) => {
      expect(
        within(row).getByRole('button', { name: new RegExp(`^${order[i] ?? ''} `) }),
      ).toBeInTheDocument();
    });
  });

  it('each row says why: attainment, growth and the status word', async () => {
    setup();
    const spain = await screen.findByRole('button', { name: /^Spain / });
    expect(spain).toHaveTextContent('104.5% · -4.6% YoY');
    expect(spain).toHaveTextContent('Off track');
  });

  it('a row drills into the market', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await screen.findByRole('button', { name: /^Italy / }));
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toEqual({
        region: 'eu',
        market: 'it',
      });
    });
  });

  it('a region without risks says so', async () => {
    setup('?region=apac');
    expect(await screen.findByText(t.empty)).toBeInTheDocument();
  });

  it('off the latest month it explains instead of listing', async () => {
    setup('?period=2026-02');
    expect(await screen.findByText(en.kpi.latestOnly)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('a product has no status of its own', async () => {
    setup('?region=eu&market=de&product=veltrix');
    expect(await screen.findByText(en.kpi.perProduct)).toBeInTheDocument();
  });
});
