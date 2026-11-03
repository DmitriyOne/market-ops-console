import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en, formats } from '@/shared/config';
import {
  chatFromFixture,
  chatStream,
  datasetHandler,
  fixtureEvents,
  server,
} from '@/shared/lib/test';

import { AssistantPanel } from './AssistantPanel';

const t = en.assistant;

function setup() {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const onAnswerDone = vi.fn();
  const onFocusDashboard = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
        <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
          <AssistantPanel onAnswerDone={onAnswerDone} onFocusDashboard={onFocusDashboard} />
        </NuqsTestingAdapter>
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
  return { onUrlUpdate, onAnswerDone, onFocusDashboard, user: userEvent.setup() };
}

async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  await user.type(screen.getByRole('textbox', { name: t.composer.label }), `${question}{Enter}`);
}

const answerDone = () =>
  waitFor(() => {
    expect(screen.getByText(t.answer.label)).toBeInTheDocument();
  });

const dataCheckToggle = () =>
  screen.queryByRole('button', { name: new RegExp(en.dataCheck.title) });

describe('AssistantPanel', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('empty state shows four suggestions', () => {
    setup();
    for (const label of Object.values(t.suggestions).filter((v) => v !== t.suggestions.title)) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('a suggestion streams at-risk with confidence, sources and an open data check', async () => {
    server.use(chatFromFixture('at-risk'));
    const { user, onAnswerDone } = setup();
    await user.click(screen.getByRole('button', { name: t.suggestions.risks }));
    await answerDone();

    expect(screen.getByText(/Three markets stand out as at risk/)).toBeInTheDocument();
    expect(screen.getByText('Confidence: High')).toBeInTheDocument();
    const sources = within(screen.getByRole('list', { name: t.answer.sources }));
    expect(sources.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Germany, latest period',
      'Germany, March dip',
      'Italy, latest period',
      'Brazil, latest period',
    ]);

    await waitFor(() => {
      expect(dataCheckToggle()).toHaveAttribute('aria-expanded', 'true');
    });
    const notMentioned = within(screen.getByRole('list', { name: en.dataCheck.notMentioned }));
    expect(notMentioned.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Spain'),
      expect.stringContaining('United Kingdom'),
      expect.stringContaining('France'),
    ]);
    expect(onAnswerDone).toHaveBeenCalledOnce();
  });

  it('germany-dip keeps the data check collapsed', async () => {
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Why did Germany dip?');
    await answerDone();
    await waitFor(() => {
      expect(dataCheckToggle()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('next-year abstains and has no data check', async () => {
    server.use(chatFromFixture('next-year'));
    const { user } = setup();
    await ask(user, 'Will sales grow next year?');
    await waitFor(() => {
      expect(screen.getByText(t.abstain.title)).toBeInTheDocument();
    });
    expect(screen.getByText(/The data covers Jun 2024 – May 2026/)).toBeInTheDocument();
    expect(dataCheckToggle()).not.toBeInTheDocument();
  });

  it('default answer has no data check', async () => {
    server.use(chatFromFixture('default'));
    const { user } = setup();
    await ask(user, 'Hello');
    await answerDone();
    expect(dataCheckToggle()).not.toBeInTheDocument();
  });

  it('force error shows the error and Retry asks again', async () => {
    server.use(chatFromFixture('error'));
    const { user } = setup();
    await ask(user, 'force error');
    const alert = await screen.findByRole('alert');
    const event = fixtureEvents('error')[0];
    expect(alert).toHaveTextContent(event?.type === 'error' ? event.message : '');
    server.use(chatFromFixture('germany-dip'));
    await user.click(within(alert).getByRole('button', { name: t.error.retry }));
    await answerDone();
    expect(screen.getAllByText('force error')).toHaveLength(2);
  });

  it('stop mid-stream shows the stopped state and no sources', async () => {
    server.use(chatFromFixture('at-risk', { stallAfter: 3 }));
    const { user } = setup();
    await ask(user, 'Which markets are at risk?');
    await waitFor(() => {
      expect(screen.getByText(t.answer.writing)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: t.composer.stop }));
    expect(screen.getByText(t.stopped.title)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: t.answer.sources })).not.toBeInTheDocument();
  });

  it('a source click focuses the dashboard on that market and month', async () => {
    server.use(chatFromFixture('at-risk'));
    const { user, onUrlUpdate, onFocusDashboard } = setup();
    await ask(user, 'Which markets are at risk?');
    await answerDone();
    await user.click(screen.getByRole('button', { name: 'Germany, March dip' }));
    await waitFor(() => {
      expect(onUrlUpdate.mock.calls.at(-1)?.[0].queryString).toBe(
        '?region=eu&market=de&period=2026-03',
      );
    });
    expect(onFocusDashboard).toHaveBeenCalledOnce();
  });

  it('"Show on dashboard" highlights every listed market', async () => {
    server.use(chatFromFixture('at-risk'));
    const { user, onUrlUpdate } = setup();
    await ask(user, 'Which markets are at risk?');
    await answerDone();
    await user.click(await screen.findByRole('button', { name: en.dataCheck.showOnDashboard }));
    await waitFor(() => {
      expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get('markets')).toBe(
        'de,es,it,gb,br,fr',
      );
    });
  });

  it('an unknown citation still has a source button, and its card says so', async () => {
    server.use(
      chatStream([
        { type: 'token', value: 'Atlantis is fine.' },
        {
          type: 'done',
          kind: 'normal',
          confidence: 'medium',
          citations: [{ marketId: 'xx', period: '1999-01', label: 'Atlantis' }],
        },
      ]),
    );
    const { user } = setup();
    await ask(user, 'Atlantis?');
    await answerDone();
    const source = screen.getByRole('button', { name: 'Atlantis' });
    source.focus();
    expect(await screen.findByText(t.evidence.notInDataset)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText(t.evidence.notInDataset)).not.toBeInTheDocument();
    });
    expect(source).toHaveFocus();
  });

  it('shows HTML in the answer as text', async () => {
    server.use(
      chatStream([
        { type: 'token', value: '<b>bold</b> claim' },
        { type: 'done', kind: 'normal', confidence: 'high', citations: [] },
      ]),
    );
    const { user } = setup();
    await ask(user, 'HTML?');
    await answerDone();
    expect(screen.getByText('<b>bold</b> claim')).toBeInTheDocument();
  });
});
