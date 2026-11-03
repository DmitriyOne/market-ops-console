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

  it('has a header that says answers are in English', () => {
    setup();
    expect(screen.getByRole('heading', { name: t.panel.title })).toBeInTheDocument();
    expect(screen.getByText(t.panel.subtitle)).toBeInTheDocument();
  });

  it('empty state shows four suggestions', () => {
    setup();
    for (const label of Object.values(t.suggestions).filter((v) => v !== t.suggestions.title)) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('a suggestion streams at-risk with confidence, sources and a data check that notes the gaps', async () => {
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
      expect(dataCheckToggle()).toHaveAttribute('aria-expanded', 'false');
    });
    // Closed by default (owner, 2026-11-03), but the header says gaps were found.
    expect(dataCheckToggle()).toHaveTextContent('3 markets not mentioned');
    await user.click(dataCheckToggle() ?? document.body);
    const table = within(screen.getByRole('table'));
    const notMentioned = table
      .getAllByRole('row')
      .filter((row) => row.textContent.includes(en.dataCheck.notMentioned))
      .map((row) => within(row).getAllByRole('cell')[0]?.textContent);
    expect(notMentioned).toEqual([
      expect.stringContaining('Spain'),
      expect.stringContaining('United Kingdom'),
      expect.stringContaining('France'),
    ]);
    expect(
      screen.getByText('6 of 13 markets need attention; the answer names 3.'),
    ).toBeInTheDocument();
    expect(onAnswerDone).toHaveBeenCalledOnce();
  });

  it('germany-dip has a closed data check with no gap note', async () => {
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Why did Germany dip?');
    await answerDone();
    await waitFor(() => {
      expect(dataCheckToggle()).toHaveAttribute('aria-expanded', 'false');
    });
    expect(dataCheckToggle()).not.toHaveTextContent(/not mentioned/);
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
    expect(screen.queryByRole('button', { name: t.suggestions.risks })).not.toBeInTheDocument();
  });

  it('an answer without matching data reads as "can\'t answer", with no data check', async () => {
    server.use(chatFromFixture('default'));
    const { user } = setup();
    await ask(user, 'Hello');
    expect(await screen.findByText(t.abstain.title)).toBeInTheDocument();
    expect(dataCheckToggle()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.suggestions.risks })).not.toBeInTheDocument();
  });

  it('a second "can\'t answer" in a row offers the suggested questions', async () => {
    server.use(chatFromFixture('default'));
    const { user } = setup();
    await ask(user, 'Hello');
    await screen.findByText(t.abstain.title);
    await ask(user, 'Hello again');
    await waitFor(() => {
      expect(screen.getAllByText(t.abstain.title)).toHaveLength(2);
    });
    expect(screen.getByRole('button', { name: t.suggestions.risks })).toBeInTheDocument();
  });

  it('a non-English question gets the English-only reply', async () => {
    const { user } = setup();
    await ask(user, 'Какие рынки под риском?');
    expect(await screen.findByText(t.declined.englishOnly)).toBeInTheDocument();
  });

  it('the evidence card of a past month shows the latest status and the anomaly', async () => {
    server.use(chatFromFixture('at-risk'));
    const { user } = setup();
    await ask(user, 'Which markets are at risk?');
    await answerDone();
    screen.getByRole('button', { name: 'Germany, March dip' }).focus();
    const card = await screen.findByText('Revenue fell 27% versus the prior month.');
    const content = card.closest('[data-slot="hover-card-content"]');
    expect(content).not.toBeNull();
    expect(content).toHaveTextContent('Status, May 2026');
    expect(content).toHaveTextContent('Off track');
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
    await user.click(await screen.findByRole('button', { name: new RegExp(en.dataCheck.title) }));
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
