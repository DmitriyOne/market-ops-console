import { screen, waitFor, within } from '@testing-library/react';
import { Toaster } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAlertRules } from '@/entities/alert-rule';
import type { AlertRule } from '@/shared/api';
import { enMessages } from '@/shared/config';
import { alertsApi, EXAMPLE_RULES, renderWithProviders, server } from '@/shared/lib/test';

import { useSimulateFailure } from './simulate-failure';
import { useRuleMutations, useSavingIds } from './use-rule-mutations';

const t = enMessages.alerts;
function example(id: string): AlertRule {
  const rule = EXAMPLE_RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`no example ${id}`);
  return rule;
}
const attainment = example('example-attainment');
const share = example('example-share');

const newRule = {
  name: 'Low growth',
  metric: 'growth',
  operator: 'below',
  threshold: 0,
  scope: { kind: 'portfolio' },
  severity: 'warning',
  enabled: true,
} as const;

function Harness() {
  const { data = [] } = useAlertRules();
  const { create, toggle, remove, update } = useRuleMutations();
  const saving = useSavingIds();
  const [, setFail] = useSimulateFailure();
  const row = (r: AlertRule) =>
    `${r.name}${r.enabled ? '' : ' (off)'}${saving.has(r.id) ? ' · saving' : ''}`;
  return (
    <>
      <ul aria-label="rules">
        {data.map((r) => (
          <li key={r.id}>{row(r)}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          create(newRule);
        }}
      >
        create
      </button>
      <button
        type="button"
        onClick={() => {
          toggle(share);
        }}
      >
        toggle share
      </button>
      <button
        type="button"
        onClick={() => {
          remove(attainment);
        }}
      >
        remove attainment
      </button>
      <button
        type="button"
        onClick={() => {
          update({ ...attainment, name: 'Renamed' });
        }}
      >
        rename
      </button>
      <button
        type="button"
        onClick={() => {
          setFail(true);
        }}
      >
        arm
      </button>
      <Toaster />
    </>
  );
}

const items = () =>
  within(screen.getByRole('list', { name: 'rules' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);

async function setup() {
  const api = alertsApi();
  server.use(...api.handlers);
  const view = renderWithProviders(<Harness />);
  await waitFor(() => {
    expect(items()).toHaveLength(2);
  });
  return { api, ...view };
}

describe('useRuleMutations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('a new rule shows at once as saving, then as saved with the server id', async () => {
    const { api, user } = await setup();
    const release = api.hold();
    await user.click(screen.getByRole('button', { name: 'create' }));
    expect(items()).toEqual(['Attainment below 95%', 'Share below 10%', 'Low growth · saving']);
    release();
    await waitFor(() => {
      expect(items()).toEqual(['Attainment below 95%', 'Share below 10%', 'Low growth']);
    });
    expect(api.rules().map((r) => r.id)).toContain('rule-1');
  });

  it('a failed save puts the list back and offers Retry, which saves', async () => {
    const { api, user } = await setup();
    api.failNext();
    await user.click(screen.getByRole('button', { name: 'create' }));
    expect(
      await screen.findByText(`Couldn't save — restored previous state. ${t.errors.simulated}`),
    ).toBeInTheDocument();
    expect(items()).toEqual(['Attainment below 95%', 'Share below 10%']);
    await user.click(screen.getByRole('button', { name: t.retry }));
    await waitFor(() => {
      expect(items()).toEqual(['Attainment below 95%', 'Share below 10%', 'Low growth']);
    });
  });

  it('the demo switch fails exactly one write, then turns itself off', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: 'arm' }));
    await user.click(screen.getByRole('button', { name: 'toggle share' }));
    await screen.findByText(/restored previous state/);
    expect(items()).toEqual(['Attainment below 95%', 'Share below 10%']);
    await user.click(screen.getByRole('button', { name: 'toggle share' }));
    await waitFor(() => {
      expect(items()).toEqual(['Attainment below 95%', 'Share below 10% (off)']);
    });
  });

  it('a failed delete puts the rule back in its place', async () => {
    const { api, user } = await setup();
    const release = api.hold();
    api.failNext();
    await user.click(screen.getByRole('button', { name: 'remove attainment' }));
    expect(items()).toEqual(['Share below 10%']);
    release();
    await waitFor(() => {
      expect(items()).toEqual(['Attainment below 95%', 'Share below 10%']);
    });
  });

  it('two quick writes to different rules both stay (the server keeps one list)', async () => {
    const { api, user } = await setup();
    const release = api.hold();
    await user.click(screen.getByRole('button', { name: 'toggle share' }));
    await user.click(screen.getByRole('button', { name: 'create' }));
    expect(items()).toEqual([
      'Attainment below 95%',
      'Share below 10% (off) · saving',
      'Low growth · saving',
    ]);
    release();
    await waitFor(() => {
      expect(items()).toEqual(['Attainment below 95%', 'Share below 10% (off)', 'Low growth']);
    });
    expect(api.rules().map((r) => `${r.name}${r.enabled ? '' : ' (off)'}`)).toEqual([
      'Attainment below 95%',
      'Share below 10% (off)',
      'Low growth',
    ]);
  });

  it('two quick writes: the first failing does not undo the second', async () => {
    const { api, user } = await setup();
    const release = api.hold();
    api.failNext();
    await user.click(screen.getByRole('button', { name: 'rename' }));
    await user.click(screen.getByRole('button', { name: 'toggle share' }));
    expect(items()).toEqual(['Renamed · saving', 'Share below 10% (off) · saving']);
    release();
    await waitFor(() => {
      expect(items()).toEqual(['Attainment below 95%', 'Share below 10% (off)']);
    });
  });
});
