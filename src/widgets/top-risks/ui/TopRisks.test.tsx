import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { AlertsPanel } from '@/features/configure-alerts';
import { enMessages as en } from '@/shared/config';
import { alertsApi, datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

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
    // No rules: the status list alone.
    server.use(datasetHandler(), ...alertsApi([]).handlers);
  });

  it('the example rules add the on-track US and Australia with a bell and the rule name', async () => {
    server.use(...alertsApi().handlers);
    setup();
    const section = await screen.findByRole('region', { name: t.title });
    await waitFor(() => {
      expect(within(section).getAllByRole('listitem')).toHaveLength(8);
    });
    const rows = within(section).getAllByRole('listitem');
    expect(rows[6]).toHaveTextContent('United States');
    expect(rows[6]).toHaveTextContent('Alert: Share below 10%');
    expect(rows[6]).toHaveTextContent('On track');
    expect(rows[7]).toHaveTextContent('Australia');
    // Germany keeps its place, with both rules and the critical bell.
    expect(rows[0]).toHaveTextContent('Critical alert: Attainment below 95% and Share below 10%');
    expect(rows[1]).not.toHaveTextContent('alert');
  });

  it('turning a rule off in the panel takes its markets out at once', async () => {
    server.use(...alertsApi().handlers);
    const { user } = renderWithProviders(
      <Suspense>
        <TopRisks />
        <AlertsPanel />
      </Suspense>,
    );
    const section = await screen.findByRole('region', { name: t.title });
    await waitFor(() => {
      expect(within(section).getAllByRole('listitem')).toHaveLength(8);
    });
    await user.click(screen.getByRole('switch', { name: 'Rule on: Share below 10%' }));
    // Optimistic: before the server answers.
    expect(within(section).getAllByRole('listitem')).toHaveLength(6);
    expect(within(section).getAllByRole('listitem')[0]).toHaveTextContent(
      'Critical alert: Attainment below 95%',
    );
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
