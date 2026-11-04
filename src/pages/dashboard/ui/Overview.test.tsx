import { screen, within } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { resolveCitation, useDashboard, useDashboardFocus } from '@/entities/performance';
import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { Overview } from './Overview';

vi.mock('next/dynamic', () => ({
  // The Recharts chart is not under test here; its words and table are.
  default: () => () => null,
}));

/** Stands in for a source button in an answer: same hook, same citation. */
function SourceStub() {
  const { ds } = useDashboard();
  const { focus } = useDashboardFocus();
  return (
    <button
      type="button"
      onClick={() => {
        focus(resolveCitation(ds, { marketId: 'de', period: '2026-03' }));
      }}
    >
      {'Germany, March'}
    </button>
  );
}

describe('Overview', () => {
  it('a failed dataset is one message with one Try again, not one per widget', async () => {
    server.use(datasetHandler({ status: 500 }));
    renderWithProviders(<Overview />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(en.errors.dataFailed);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(alert).getByRole('button', { name: en.errors.retry })).toBeInTheDocument();
  });

  it('Try again loads the dashboard once the data is back', async () => {
    server.use(datasetHandler({ status: 500 }));
    const { user } = renderWithProviders(<Overview />);
    const retry = await screen.findByRole('button', { name: en.errors.retry });
    server.use(datasetHandler());
    await user.click(retry);
    expect(await screen.findByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('an assistant source click moves the whole dashboard', async () => {
    server.use(datasetHandler());
    const { user } = renderWithProviders(
      <>
        <Suspense>
          <SourceStub />
        </Suspense>
        <Overview />
      </>,
    );
    await screen.findByRole('heading', { level: 1, name: 'Portfolio' });
    await user.click(await screen.findByRole('button', { name: 'Germany, March' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Germany' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: en.kpi.attainment })).getByText(/%$/),
    ).toBeInTheDocument();
    // March is not the latest month: no status anywhere.
    expect(screen.getAllByText(en.kpi.latestOnly).length).toBeGreaterThan(0);
  });
});
