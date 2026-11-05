import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { HeatMap } from './HeatMap';

const t = en.heatMap;

function setup(searchParams = '?mode=analyst') {
  return renderWithProviders(
    <Suspense>
      <HeatMap />
    </Suspense>,
    { searchParams },
  );
}

const grid = () => screen.findByRole('grid');
const cell = (name: RegExp) => screen.getByRole('button', { name });
const query = (update: { queryString: string } | undefined) =>
  Object.fromEntries(new URLSearchParams(update?.queryString));

describe('HeatMap', () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(datasetHandler());
  });

  it('the default Analyst view shows growth by month, with the notice and Germany’s dip', async () => {
    setup();
    expect(await screen.findByRole('region', { name: t.title })).toBeInTheDocument();
    expect(screen.getByText(t.notice.statusPerMonth)).toBeInTheDocument();
    const g = await grid();
    expect(within(g).getAllByRole('rowheader')).toHaveLength(13);
    const dip = cell(/^Germany, Mar 2026: -31\.\d%/);
    expect(dip).toHaveAccessibleName(/anomaly: Revenue fell 27% versus the prior month/);
    expect(dip).toHaveTextContent('-31%');
  });

  it('one Tab stop; arrows move and stop at the edges', async () => {
    const { user } = setup();
    const g = await grid();
    // Past the header's buttons, into the grid: one stop.
    while (!g.contains(document.activeElement)) await user.tab();
    const first = document.activeElement;
    // Starts on the selected month (the latest), in the first row.
    expect(first).toHaveAccessibleName(/^Canada, May 2026/);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(first);
    await user.keyboard('{ArrowLeft}{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName(/^United States, Apr 2026/);
    await user.keyboard('{Home}');
    expect(document.activeElement).toHaveAccessibleName(/^United States, Jun 2024/);
    await user.keyboard('{Control>}{End}{/Control}');
    expect(document.activeElement).toHaveAccessibleName(/^Mexico, May 2026/);
    expect(
      screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0'),
    ).toHaveLength(1);
  });

  it('Enter opens the market at that month and keeps the range', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&range=3m&markets=es');
    await grid();
    cell(/^Germany, Mar 2026/).focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(query(lastUpdate())).toEqual({
        mode: 'analyst',
        range: '3m',
        region: 'eu',
        market: 'de',
        period: '2026-03',
      });
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });

  it('Shift+Enter selects the market without opening it; the row says so', async () => {
    const { user, lastUpdate } = setup();
    await grid();
    cell(/^Germany, Mar 2026/).focus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await waitFor(() => {
      expect(query(lastUpdate())).toEqual({ mode: 'analyst', markets: 'de' });
    });
    expect(await screen.findByRole('rowheader', { name: /Germany.*selected/ })).toBeInTheDocument();
  });

  it('keeps focus on the grid when an open moves the rows', async () => {
    const { user } = setup();
    await grid();
    cell(/^Mexico, May 2026/).focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getAllByRole('rowheader')).toHaveLength(2);
    });
    expect(document.activeElement).toHaveAccessibleName(/^Mexico, May 2026/);
  });

  it('a click shows the cell and its actions under the grid', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&kpi=attainment');
    await grid();
    await user.hover(cell(/^Spain, Jan 2026/));
    expect(screen.getByText(/Spain · Jan 2026 · Attainment 10\d\.\d%/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Spain to selection' }));
    await waitFor(() => {
      expect(query(lastUpdate())).toMatchObject({ markets: 'es' });
    });
  });

  it('marks the window of a 3-month range on the month headers', async () => {
    setup('?mode=analyst&range=3m');
    const g = await grid();
    const marked = within(g)
      .getAllByRole('columnheader')
      .filter((h) => h.textContent.includes(t.inWindow));
    expect(marked).toHaveLength(3);
  });

  it('a table alternative, remembered per browser', async () => {
    const { user, unmount } = setup('?mode=analyst&kpi=attainment');
    await grid();
    await user.click(screen.getByRole('button', { name: t.showTable }));
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('columnheader')).toHaveLength(25);
    expect(within(table).getByRole('row', { name: /Germany/ })).toHaveTextContent('92.2%');
    unmount();
    setup('?mode=analyst');
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
