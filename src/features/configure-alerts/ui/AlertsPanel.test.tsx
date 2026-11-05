import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages } from '@/shared/config';
import { alertsApi, datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { AlertsPanel } from './AlertsPanel';

const t = enMessages.alerts;

function setup(searchParams = '', api = alertsApi()) {
  server.use(datasetHandler(), ...api.handlers);
  const view = renderWithProviders(
    <Suspense>
      <AlertsPanel />
      <Toaster />
    </Suspense>,
    { searchParams },
  );
  return { api, ...view };
}

const rulesList = () => screen.findByRole('list', { name: t.list.label });

async function choose(user: ReturnType<typeof setup>['user'], label: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('AlertsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists the rules in plain words, with how many markets each flags now', async () => {
    setup();
    const items = within(await rulesList()).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Attainment below 95%');
    expect(items[0]).toHaveTextContent('Attainment below 95% · All markets');
    expect(items[0]).toHaveTextContent('Critical·Flags 3 markets now');
    expect(items[1]).toHaveTextContent('Share below 10% · All markets');
    expect(screen.getByRole('switch', { name: 'Rule on: Share below 10%' })).toBeChecked();
  });

  it('a new rule: translated errors, then saved and back in the list', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    const name = screen.getByRole('textbox', { name: t.form.name });
    const threshold = screen.getByRole('textbox', { name: 'Threshold, %' });
    await user.clear(threshold);
    await user.type(threshold, '250');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    expect(await screen.findByText(t.form.errors.nameRequired)).toBeInTheDocument();
    expect(screen.getByText('Enter a number from 0 to 200.')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription(t.form.errors.nameRequired);
    // Focus goes to the first field with an error.
    expect(name).toHaveFocus();

    await user.type(name, 'share below 10%');
    await user.tab();
    expect(await screen.findByText(t.form.errors.duplicateName)).toBeInTheDocument();
    await user.clear(name);
    await user.type(name, 'Weak growth');
    await choose(user, t.form.metric, 'Growth');
    await user.clear(threshold);
    await user.type(threshold, '0');
    expect(
      screen.getByText('Would flag 2 markets now (May 2026): Germany and Spain'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.form.save }));

    const items = within(await rulesList()).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[2]).toHaveTextContent('Growth below 0% · All markets');
    expect(screen.getByRole('button', { name: t.list.new })).toHaveFocus();
    await waitFor(() => {
      expect(api.rules().map((r) => r.name)).toContain('Weak growth');
    });
  });

  it('"Chosen markets" starts with the dashboard selection; one market is required', async () => {
    const { user } = setup('?markets=de&markets=es');
    await rulesList();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    const group = screen.getByRole('group', { name: t.form.markets });
    expect(within(group).getByRole('checkbox', { name: 'Germany' })).toBeChecked();
    expect(within(group).getByRole('checkbox', { name: 'Spain' })).toBeChecked();
    expect(screen.getByText('Would flag 1 market now (May 2026): Germany')).toBeInTheDocument();
    await user.click(within(group).getByRole('checkbox', { name: 'Germany' }));
    await user.click(within(group).getByRole('checkbox', { name: 'Spain' }));
    expect(screen.getByText(t.preview.incomplete)).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Picked');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    expect(await screen.findByText(t.form.errors.marketsRequired)).toBeInTheDocument();
  });

  it('revenue is typed in millions, with a comma too', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Small markets');
    await choose(user, t.form.metric, 'Revenue');
    const threshold = screen.getByRole('textbox', { name: 'Threshold, M$' });
    expect(threshold).toHaveAccessibleDescription(t.form.revenueHint);
    await user.clear(threshold);
    await user.type(threshold, '0,95');
    expect(
      screen.getByText('Would flag 4 markets now (May 2026): Italy, Spain, Australia and Mexico'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.form.save }));
    await waitFor(() => {
      expect(api.rules().find((r) => r.name === 'Small markets')?.threshold).toBe(950_000);
    });
  });

  it('edit fills the form and saves the change', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('button', { name: 'Edit Share below 10%' }));
    const threshold = screen.getByRole('textbox', { name: 'Threshold, %' });
    expect(threshold).toHaveValue('10');
    await user.clear(threshold);
    await user.type(threshold, '9');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    await waitFor(() => {
      expect(api.rules().find((r) => r.id === 'example-share')?.threshold).toBe(9);
    });
  });

  it('delete asks first, then removes the rule', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('button', { name: 'Delete Share below 10%' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete “Share below 10%”?' });
    await user.click(within(dialog).getByRole('button', { name: t.delete.cancel }));
    expect(within(await rulesList()).getAllByRole('listitem')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Delete Share below 10%' }));
    await user.click(await screen.findByRole('button', { name: t.delete.confirm }));
    await waitFor(() => {
      expect(api.rules().map((r) => r.id)).toEqual(['example-attainment']);
    });
  });

  it('ten rules: New rule is off and says why', async () => {
    const base = {
      metric: 'growth',
      operator: 'below',
      threshold: 0,
      scope: { kind: 'portfolio' },
      severity: 'warning',
      enabled: true,
    } as const;
    setup(
      '',
      alertsApi(
        Array.from({ length: 10 }, (_, i) => ({ ...base, id: String(i), name: `R${String(i)}` })),
      ),
    );
    await rulesList();
    const button = screen.getByRole('button', { name: t.list.new });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(t.list.full);
  });

  it('the demo switch: the next save fails and is rolled back', async () => {
    const { user } = setup();
    await rulesList();
    await user.click(screen.getByRole('switch', { name: t.simulate.label }));
    await user.click(screen.getByRole('switch', { name: 'Rule on: Share below 10%' }));
    expect(await screen.findByText(/restored previous state/)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Rule on: Share below 10%' })).toBeChecked();
    expect(screen.getByRole('switch', { name: t.simulate.label })).not.toBeChecked();
  });

  it('a list that fails to load says so with Try again', async () => {
    server.use(datasetHandler());
    const api = alertsApi();
    setup('', api);
    server.use(
      (await import('msw')).http.get('*/api/v1/alerts', () =>
        Response.json({ error: { code: 'x' } }, { status: 500 }),
      ),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(t.list.loadFailed);
  });
});
