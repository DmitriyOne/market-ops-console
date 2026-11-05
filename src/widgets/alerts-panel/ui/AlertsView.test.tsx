import { screen, waitFor, within } from '@testing-library/react';
import { Suspense, useState } from 'react';
import { Toaster } from 'sonner';
import { describe, expect, it } from 'vitest';

import { enMessages } from '@/shared/config';
import { alertsApi, datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { AlertsView } from './AlertsView';

const t = enMessages.alerts;

function setup(searchParams = '?tab=alerts', api = alertsApi()) {
  server.use(datasetHandler(), ...api.handlers);
  return {
    api,
    ...renderWithProviders(
      <Suspense>
        <AlertsView />
        <Toaster />
      </Suspense>,
      { searchParams },
    ),
  };
}

const firing = () => screen.findByRole('region', { name: /^Firing now/ });
const query = (update: { queryString: string } | undefined) =>
  Object.fromEntries(new URLSearchParams(update?.queryString));

describe('AlertsView', () => {
  it('lists what fires now, most severe first, with each market’s figure', async () => {
    setup();
    const section = await firing();
    expect(section).toHaveAccessibleName('Firing now: 5 markets (May 2026)');
    const rows = within(section).getAllByRole('listitem');
    expect(rows.map((r) => r.querySelector('p')?.textContent)).toEqual([
      'Germany, Critical',
      'United Kingdom, Critical',
      'Italy, Critical',
      'United States, Warning',
      'Australia, Warning',
    ]);
    expect(rows[0]).toHaveTextContent('Attainment 92.0% · below 95%');
    expect(rows[0]).toHaveTextContent('Share 8.9% · below 10%');
  });

  it('Open leaves the panel and opens the market (one history step)', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await screen.findByRole('button', { name: 'Open United States' }));
    await waitFor(() => {
      expect(query(lastUpdate())).toEqual({ region: 'na', market: 'us' });
    });
  });

  it('no rule firing says so', async () => {
    setup('?tab=alerts', alertsApi([]));
    expect(await screen.findByText(t.triggered.none)).toBeInTheDocument();
  });

  it('a save the server confirms says how many markets the rule flags; Show goes to the list', async () => {
    const { user } = setup();
    await firing();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Weak growth');
    await user.click(screen.getByRole('combobox', { name: t.form.metric }));
    await user.click(await screen.findByRole('option', { name: 'Growth' }));
    const threshold = screen.getByRole('textbox', { name: 'Threshold, %' });
    await user.clear(threshold);
    await user.type(threshold, '0');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    expect(
      await screen.findByText('Saved “Weak growth”: it flags 2 markets now.'),
    ).toBeInTheDocument();
    // The form saved from "Firing" lands on "Rules"; Show goes back to what fires.
    expect(screen.getByRole('radio', { name: /^Rules/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: t.triggered.show }));
    // Spain joins the list (growth −4.6 %).
    expect(await firing()).toHaveAccessibleName('Firing now: 6 markets (May 2026)');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Firing now/ })).toHaveFocus();
    });
  });

  it('the confirmed-save toast still comes when another rule is toggled meanwhile', async () => {
    const api = alertsApi();
    const { user } = setup('?tab=alerts', api);
    await firing();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Saved while toggling');
    const release = api.hold();
    await user.click(screen.getByRole('button', { name: t.form.save }));
    // Before the server answers, another write starts.
    await user.click(screen.getByRole('switch', { name: 'Rule on: Share below 10%' }));
    release();
    expect(
      await screen.findByText(/^Saved “Saved while toggling”: it flags \d+ markets? now\.$/),
    ).toBeInTheDocument();
  });

  it('a save confirmed after the panel closed still says so; Show opens the panel again', async () => {
    function Closable() {
      const [open, setOpen] = useState(true);
      return (
        <>
          {open ? <AlertsView /> : null}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
            }}
          >
            close panel
          </button>
        </>
      );
    }
    const api = alertsApi();
    server.use(datasetHandler(), ...api.handlers);
    const { user, lastUpdate } = renderWithProviders(
      <Suspense>
        <Closable />
        <Toaster />
      </Suspense>,
    );
    await firing();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Closed meanwhile');
    const release = api.hold();
    await user.click(screen.getByRole('button', { name: t.form.save }));
    await user.click(screen.getByRole('button', { name: 'close panel' }));
    release();
    // Sonner's toasts outlive a test; find this one.
    const message = await screen.findByText(/^Saved “Closed meanwhile”/);
    const toastItem = message.closest('li');
    if (!toastItem) throw new Error('no toast');
    await user.click(within(toastItem).getByRole('button', { name: t.triggered.show }));
    await waitFor(() => {
      expect(query(lastUpdate())).toEqual({ tab: 'alerts' });
    });
  });
});
