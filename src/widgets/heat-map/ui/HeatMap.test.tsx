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
/**
 * A cell by its row and column headers, as a screen reader names it (the
 * button itself says only the value). `month` is the header's text, "Mar 26".
 */
function cell(market: string, month: string): HTMLElement {
  const g = screen.getByRole('grid');
  const col = within(g)
    .getAllByRole('columnheader')
    .findIndex((h) => h.textContent.startsWith(month));
  const row = within(g)
    .getAllByRole('row')
    .find((r) => within(r).queryByRole('rowheader')?.textContent.startsWith(market));
  // The first column is the market's header; each cell holds one button.
  const button = row ? within(row).getAllByRole('button')[col - 1] : undefined;
  if (!button) throw new Error(`no cell ${market}, ${month}`);
  return button;
}
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
    // The visible figure, then the exact one (label in name, WCAG 2.5.3);
    // the market and month come from the headers, not repeated in the name.
    const dip = cell('Germany', 'Mar 26');
    expect(dip).toHaveAccessibleName(
      /^-31% \(-31\.\d%\), anomaly: Revenue fell 27% versus the prior month\.$/,
    );
    expect(dip).toHaveTextContent('-31%');
    // The column says the whole month to a screen reader ("Mar 26" on screen).
    expect(within(g).getByRole('columnheader', { name: 'Mar 2026' })).toBeInTheDocument();
  });

  it('one Tab stop; arrows move and stop at the edges', async () => {
    const { user } = setup();
    const g = await grid();
    // Past the header's buttons, into the grid: one stop.
    while (!g.contains(document.activeElement)) await user.tab();
    const first = document.activeElement;
    // Starts on the selected month (the latest), in the first row.
    expect(first).toBe(cell('Canada', 'May 26'));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(first);
    await user.keyboard('{ArrowLeft}{ArrowDown}');
    expect(document.activeElement).toBe(cell('United States', 'Apr 26'));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(cell('United States', 'Jun 24'));
    await user.keyboard('{Control>}{End}{/Control}');
    expect(document.activeElement).toBe(cell('Mexico', 'May 26'));
    expect(
      screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0'),
    ).toHaveLength(1);
  });

  it('Enter opens the market at that month and keeps the range', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&range=3m&markets=es');
    await grid();
    cell('Germany', 'Mar 26').focus();
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
    cell('Germany', 'Mar 26').focus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await waitFor(() => {
      expect(query(lastUpdate())).toEqual({ mode: 'analyst', markets: 'de' });
    });
    expect(await screen.findByRole('rowheader', { name: /Germany.*selected/ })).toBeInTheDocument();
  });

  it('keeps focus on the grid when an open moves the rows', async () => {
    const { user } = setup();
    await grid();
    cell('Mexico', 'May 26').focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getAllByRole('rowheader')).toHaveLength(2);
    });
    expect(document.activeElement).toBe(cell('Mexico', 'May 26'));
  });

  it('the line under the grid previews the hovered cell and acts on the pinned one', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&kpi=attainment');
    const g = await grid();
    cell('Spain', 'Jan 26').focus();
    await user.hover(cell('Mexico', 'Jan 26'));
    expect(screen.getByText(/Mexico · Jan 2026 · Attainment/)).toBeInTheDocument();
    // On the way to the buttons the mouse leaves the grid: the pinned cell is back.
    await user.unhover(g);
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

  it('the table keeps what the grid shows: anomalies, selected and open markets', async () => {
    const { user } = setup('?mode=analyst&region=eu&market=fr&markets=de');
    await grid();
    await user.click(screen.getByRole('button', { name: t.showTable }));
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('rowheader', { name: /Germany, selected/ })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: /France\s*· open now/ })).toBeInTheDocument();
    expect(
      screen.getByText(/Germany · Mar 2026: anomaly: Revenue fell 27% versus the prior month/),
    ).toBeInTheDocument();
  });

  it('in a product view the anomaly is said to be the whole market’s', async () => {
    setup('?mode=analyst&region=eu&market=de&product=veltrix');
    await grid();
    expect(cell('Germany', 'Mar 26')).toHaveAccessibleName(
      /anomaly in the whole market: Revenue fell 27%/,
    );
  });
});
