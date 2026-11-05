import { screen, waitFor, within } from '@testing-library/react';
import { Suspense, useState } from 'react';
import { Toaster } from 'sonner';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages } from '@/shared/config';
import { alertsApi, datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { AlertsPanel, type AlertTab } from './AlertsPanel';

const t = enMessages.alerts;

function Panel({ initial = 'rules' }: { initial?: AlertTab }) {
  const [tab, setTab] = useState<AlertTab>(initial);
  return <AlertsPanel tab={tab} onTabChange={setTab} firing={<p>Firing content</p>} />;
}

function setup(searchParams = '', api = alertsApi(), initial: AlertTab = 'rules') {
  server.use(datasetHandler(), ...api.handlers);
  const view = renderWithProviders(
    <Suspense>
      <Panel initial={initial} />
      <Toaster />
    </Suspense>,
    { searchParams },
  );
  return { api, ...view };
}

const rulesList = () => screen.findByRole('list', { name: t.list.label });

async function ruleRow(name: string): Promise<HTMLElement> {
  const rows = within(await rulesList()).getAllByRole('listitem');
  const row = rows.find((li) => within(li).queryByText(name));
  if (!row) throw new Error(`no row for ${name}`);
  return row;
}

async function choose(user: ReturnType<typeof setup>['user'], label: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('AlertsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('two tabs with counts; New rule is there on both; the form has Back', async () => {
    const { user } = setup('', alertsApi(), 'firing');
    const tabs = await screen.findByRole('radiogroup', { name: t.tabs.label });
    expect(await within(tabs).findByRole('radio', { name: 'Firing · 5' })).toBeChecked();
    expect(within(tabs).getByRole('radio', { name: 'Rules · 2' })).not.toBeChecked();
    expect(screen.getByText('Firing content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.list.new })).toBeEnabled();
    await user.click(within(tabs).getByRole('radio', { name: 'Rules · 2' }));
    expect(await rulesList()).toBeInTheDocument();
    expect(screen.queryByText('Firing content')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    expect(screen.queryByRole('radiogroup', { name: t.tabs.label })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.form.back }));
    expect(screen.getByRole('button', { name: t.list.new })).toHaveFocus();
  });

  it('a save from the Firing tab lands on Rules, where the new rule shows', async () => {
    const { user } = setup('', alertsApi(), 'firing');
    await user.click(await screen.findByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Low attainment EU');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    expect(screen.getByRole('radio', { name: /^Rules/ })).toBeChecked();
    expect(within(await rulesList()).getAllByRole('listitem')).toHaveLength(3);
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
    // The first wrong field takes focus: the first market, which reads the error.
    const first = within(group).getAllByRole('checkbox')[0];
    expect(first).toHaveFocus();
    expect(first).toHaveAccessibleDescription(t.form.errors.marketsRequired);
    // The whole row is the target: a tap on the name ticks it.
    await user.click(within(group).getByText('Italy'));
    expect(within(group).getByRole('checkbox', { name: 'Italy' })).toBeChecked();
  });

  it('revenue is typed in millions, with a comma too', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Small markets');
    await choose(user, t.form.metric, 'Revenue');
    const threshold = screen.getByRole('textbox', { name: 'Threshold, M$' });
    expect(threshold).toHaveAccessibleDescription('In millions of US dollars, e.g. 1.5');
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

  describe('in another currency (ADR 0017)', () => {
    it('EUR: typed in millions of euros, previewed on euro revenue, stored in USD', async () => {
      localStorage.setItem('mo:currency', 'EUR');
      const { user, api } = setup();
      await rulesList();
      await user.click(screen.getByRole('button', { name: t.list.new }));
      await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Under a million');
      await choose(user, t.form.metric, 'Revenue');
      const threshold = screen.getByRole('textbox', { name: 'Threshold, M€' });
      expect(threshold).toHaveAccessibleDescription('In millions of euros, e.g. 1.5');
      await user.clear(threshold);
      await user.type(threshold, '1');
      // Brazil: 1,115,100 $ = 993,498 € — under €1M, though over $1M.
      expect(
        screen.getByText(/^Would flag 5 markets now \(May 2026\): .*Brazil/),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: t.form.save }));
      // 1,000,000 € ÷ 0.89095 = 1,122,397 $
      await waitFor(() => {
        expect(api.rules().find((r) => r.name === 'Under a million')?.threshold).toBe(1_122_397);
      });
      const row = await ruleRow('Under a million');
      expect(row).toHaveTextContent('Revenue below €1m · All markets');
      expect(row).toHaveTextContent('Flags 5 markets now');
    });

    it('GBP: editing only the name keeps the stored USD threshold to the dollar', async () => {
      localStorage.setItem('mo:currency', 'GBP');
      const stored = {
        id: 'r-rev',
        name: 'Revenue watch',
        metric: 'revenue',
        operator: 'below',
        // £742,991 shown; £742,991 ÷ 0.74299 would round to 1,000,001 $.
        threshold: 1_000_002,
        scope: { kind: 'portfolio' },
        severity: 'warning',
        enabled: true,
      } as const;
      const { user, api } = setup('', alertsApi([stored]));
      await user.click(await screen.findByRole('button', { name: 'Edit Revenue watch' }));
      expect(screen.getByRole('textbox', { name: 'Threshold, M£' })).toHaveValue('0.742991');
      const name = screen.getByRole('textbox', { name: t.form.name });
      await user.clear(name);
      await user.type(name, 'Revenue watch UK');
      await user.click(screen.getByRole('button', { name: t.form.save }));
      await waitFor(() => {
        expect(api.rules()[0]?.name).toBe('Revenue watch UK');
      });
      expect(api.rules()[0]?.threshold).toBe(1_000_002);
    });
  });

  it('a revenue threshold reads as typed: 1.25 M$ is "$1.25m", not "$1.3m"', async () => {
    const { user } = setup();
    await rulesList();
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Mid revenue');
    await choose(user, t.form.metric, 'Revenue');
    const threshold = screen.getByRole('textbox', { name: 'Threshold, M$' });
    await user.clear(threshold);
    await user.type(threshold, '1.25');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    const items = within(await rulesList()).getAllByRole('listitem');
    expect(items[2]).toHaveTextContent('Revenue below $1.25m · All markets');
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
    // Its row (and the button that opened the dialog) is gone: focus goes to New rule.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: t.list.new })).toHaveFocus();
    });
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

  it('a failed toggle offers Retry in the row, next after the switch for the keyboard', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('switch', { name: t.simulate.label }));
    const share = screen.getByRole('switch', { name: 'Rule on: Share below 10%' });
    await user.click(share);
    const row = await ruleRow('Share below 10%');
    expect(await within(row).findByText(/^Not saved\. Simulated failure/)).toBeInTheDocument();
    expect(share).toBeChecked();
    expect(share).toHaveFocus();
    await user.tab();
    expect(within(row).getByRole('button', { name: 'Retry: Share below 10%' })).toHaveFocus();
    await user.keyboard('{Enter}');
    // The button is gone with the failure; focus stays on the rule.
    await waitFor(() => {
      expect(row).toHaveFocus();
    });
    await waitFor(() => {
      expect(api.rules().find((r) => r.id === 'example-share')?.enabled).toBe(false);
    });
    expect(within(row).queryByText(/^Not saved/)).not.toBeInTheDocument();
  });

  it('a failed new rule: the note above the list brings it back, or is dismissed', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('switch', { name: t.simulate.label }));
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Low attainment EU');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    expect(await screen.findByText(/^“Low attainment EU” wasn't saved\./)).toBeInTheDocument();
    expect(within(await rulesList()).getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Dismiss: Low attainment EU' }));
    expect(screen.queryByText(/wasn't saved/)).not.toBeInTheDocument();
    expect(api.rules()).toHaveLength(2);

    // Again, and this time Retry: the rule is back and saved; focus is on the list.
    await user.click(screen.getByRole('switch', { name: t.simulate.label }));
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Low attainment EU');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    await user.click(await screen.findByRole('button', { name: 'Retry: Low attainment EU' }));
    const list = await rulesList();
    expect(await within(list).findByText('Low attainment EU')).toBeInTheDocument();
    await waitFor(() => {
      expect(list).toHaveFocus();
    });
    await waitFor(() => {
      expect(api.rules()).toHaveLength(3);
    });
  });

  it('Retry in the row closes the toast: the same failure is never sent twice', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('switch', { name: t.simulate.label }));
    await user.click(screen.getByRole('button', { name: t.list.new }));
    await user.type(screen.getByRole('textbox', { name: t.form.name }), 'Low attainment EU');
    await user.click(screen.getByRole('button', { name: t.form.save }));
    const toastRetry = await screen.findByRole('button', { name: t.retry });
    await user.click(screen.getByRole('button', { name: 'Retry: Low attainment EU' }));
    await waitFor(() => {
      expect(toastRetry).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(api.rules()).toHaveLength(3);
    });
    expect(within(await rulesList()).getAllByText('Low attainment EU')).toHaveLength(1);
  });

  it('Dismiss forgets every failure of the rule, not only the latest', async () => {
    const { user } = setup();
    await rulesList();
    const fail = screen.getByRole('switch', { name: t.simulate.label });
    // A failed toggle, then another failed toggle of the same rule.
    await user.click(fail);
    await user.click(screen.getByRole('switch', { name: 'Rule on: Share below 10%' }));
    expect(await screen.findByText(/^Not saved\./)).toBeInTheDocument();
    await user.click(fail);
    await user.click(screen.getByRole('switch', { name: 'Rule on: Share below 10%' }));
    await waitFor(() => {
      expect(fail).not.toBeChecked();
    });
    expect(await screen.findByText(/^Not saved\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss: Share below 10%' }));
    expect(screen.queryByText(/^Not saved/)).not.toBeInTheDocument();
  });

  it('a failed delete puts the rule back with Retry; the retried delete leaves focus on the list', async () => {
    const { user, api } = setup();
    await rulesList();
    await user.click(screen.getByRole('switch', { name: t.simulate.label }));
    await user.click(screen.getByRole('button', { name: 'Delete Share below 10%' }));
    await user.click(await screen.findByRole('button', { name: t.delete.confirm }));
    expect(await screen.findByText(/^Not deleted\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry: Share below 10%' }));
    await waitFor(() => {
      expect(api.rules().map((r) => r.id)).toEqual(['example-attainment']);
    });
    const list = await rulesList();
    await waitFor(() => {
      expect(list).toHaveFocus();
    });
  });

  it('a rule being saved is dimmed, busy and says "Saving…" until the server answers', async () => {
    const { user, api } = setup();
    await rulesList();
    const release = api.hold();
    await user.click(screen.getByRole('switch', { name: 'Rule on: Share below 10%' }));
    const row = await ruleRow('Share below 10%');
    expect(row).toHaveAttribute('aria-busy', 'true');
    expect(row).toHaveTextContent(t.list.saving);
    // Still focused and focusable, but a second press waits for the first.
    const share = within(row).getByRole('switch');
    expect(share).toHaveFocus();
    expect(share).toHaveAttribute('aria-disabled', 'true');
    await user.click(share);
    expect(share).not.toBeChecked();
    release();
    await waitFor(() => {
      expect(row).not.toHaveAttribute('aria-busy');
    });
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
