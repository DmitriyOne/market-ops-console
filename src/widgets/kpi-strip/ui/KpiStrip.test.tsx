import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { KpiStrip } from './KpiStrip';

const t = en.kpi;

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <KpiStrip />
    </Suspense>,
    { searchParams },
  );
}

const card = (label: string) => screen.findByRole('group', { name: label });

describe('KpiStrip', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('portfolio, May 2026: the four figures of the brief', async () => {
    setup();
    const section = await screen.findByRole('region', { name: t.title });
    expect(within(section).getByText('$22.9m')).toBeInTheDocument();
    expect(within(section).getByText('100.4%')).toBeInTheDocument();
    expect(within(section).getAllByText('+7.3%').length).toBeGreaterThan(0);
    expect(within(section).getByText('6 of 13')).toBeInTheDocument();
    expect(within(section).getByText('2 off track · 4 at risk')).toBeInTheDocument();
  });

  describe('in another currency', () => {
    it('shows revenue in euros at the fixed rate; the percentages stay', async () => {
      setup('?currency=EUR');
      const section = await screen.findByRole('region', { name: t.title });
      // 22,850,419 $ × 0.89095 = 20,358,581 €
      expect(await within(section).findByText('€20.4m')).toBeInTheDocument();
      expect(within(section).getByText('100.4%')).toBeInTheDocument();
      expect(within(section).getAllByText('+7.3%').length).toBeGreaterThan(0);
      expect(within(section).queryByText(/\$/)).toBeNull();
    });
  });

  it('computed figures carry a "Calculated" badge that names the formula', async () => {
    setup();
    const revenue = await card(t.revenue);
    expect(
      within(revenue).getByRole('button', {
        name: `Calculated: ${t.formula.revenue}`,
      }),
    ).toBeInTheDocument();
  });

  it('tapping "Calculated" shows the formula (no hover needed on a phone)', async () => {
    const { user } = setup();
    const revenue = await card(t.revenue);
    await user.click(
      within(revenue).getByRole('button', { name: `Calculated: ${t.formula.revenue}` }),
    );
    expect(await screen.findByRole('dialog')).toHaveTextContent(t.formula.revenue);
  });

  it('a market in the latest month shows stored figures, without the badge', async () => {
    setup('?region=eu&market=de');
    const attainment = await card(t.attainment);
    expect(within(attainment).getByText('92.0%')).toBeInTheDocument();
    expect(
      within(attainment).queryByRole('button', { name: /^Calculated/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
  });

  it('off the latest month the risk count says why and offers the latest month', async () => {
    const { user, lastUpdate } = setup('?period=2026-03&range=3m');
    expect(await screen.findByText(t.latestOnly)).toBeInTheDocument();
    expect(screen.queryByText(/of 13/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show May 2026' }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('');
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });

  it('a product has no status of its own', async () => {
    setup('?region=eu&market=de&product=veltrix');
    expect(await screen.findByText(t.perProduct)).toBeInTheDocument();
  });
});
