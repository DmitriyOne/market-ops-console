import { screen, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { RevenueTrend } from './RevenueTrend';

const t = en.trend;

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <RevenueTrend />
    </Suspense>,
    { searchParams },
  );
}

describe('RevenueTrend', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('titled with the months it covers, with a legend of line patterns', async () => {
    setup();
    const section = await screen.findByRole('region', { name: 'Revenue · Jun 2024 – May 2026' });
    const legend = within(section).getByRole('list', { name: /legend/i });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([t.actual, t.forecast, t.priorYear]);
  });

  it('describes the chart in words for the selected month', async () => {
    setup('?period=2026-03');
    expect(
      await screen.findByText(
        /^Revenue for Portfolio, Jun 2024 to May 2026\. Mar 2026: actual US\$21\.2m, forecast US\$21\.1m, prior year US\$20\.4m\.$/,
      ),
    ).toBeInTheDocument();
  });

  it('names anomalies in the data, for the scope', async () => {
    setup('?region=eu&market=de');
    expect(await screen.findByText(/^Mar 2026 · Germany:/)).toBeInTheDocument();
  });

  it('no anomaly note where there is none', async () => {
    setup('?region=apac');
    await screen.findByRole('region', { name: /^Revenue/ });
    expect(screen.queryByText(/· Germany:/)).not.toBeInTheDocument();
  });

  it('"Show as table" lists every month with the three values', async () => {
    const { user } = setup('?region=eu&market=de&period=2026-03');
    await user.click(await screen.findByRole('button', { name: t.showTable }));
    const table = screen.getByRole('table', { name: 'Revenue by month for Germany' });
    expect(within(table).getAllByRole('row')).toHaveLength(25);
    const march = within(table).getByRole('row', { name: /Mar 2026/ });
    expect(march).toHaveTextContent(t.anomalyMark);
    expect(march).toHaveTextContent(t.window);
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual([t.month, t.actual, t.forecast, t.priorYear]);
  });
});
