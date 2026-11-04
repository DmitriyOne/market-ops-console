import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { renderToString } from 'react-dom/server';
import { Toaster } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en, formats } from '@/shared/config';
import {
  chatFromFixture,
  chatStream,
  datasetHandler,
  fixtureEvents,
  server,
} from '@/shared/lib/test';
import { TooltipProvider } from '@/shared/ui';

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
          <TooltipProvider>
            <AssistantPanel onAnswerDone={onAnswerDone} onFocusDashboard={onFocusDashboard} />
          </TooltipProvider>
          <Toaster />
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

const tokensText = (id: string) =>
  fixtureEvents(id)
    .flatMap((e) => (e.type === 'token' ? [e.value] : []))
    .join('')
    .split('\n\n')[0] ?? '';

const dataCheckToggle = () =>
  screen.queryByRole('button', { name: new RegExp(en.dataCheck.title) });

describe('AssistantPanel', () => {
  beforeEach(() => {
    sessionStorage.clear();
    server.use(datasetHandler());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('server HTML shows a loading conversation, not the empty state (history is client-only)', () => {
    const client = new QueryClient();
    const html = renderToString(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
          <NuqsTestingAdapter>
            <TooltipProvider>
              <AssistantPanel />
            </TooltipProvider>
          </NuqsTestingAdapter>
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(t.panel.loading);
    // Shaped like the chat: a question bubble and an answer frame.
    expect(html).toContain('data-skeleton="question"');
    expect(html).toContain('data-skeleton="answer"');
    expect(html).not.toContain(t.panel.empty.title);
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

  it('force error shows a translated error, not the server text, and Retry asks again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(chatFromFixture('error'));
    const { user } = setup();
    await ask(user, 'force error');
    expect(await screen.findByText(en.errors.server)).toBeInTheDocument();
    const event = fixtureEvents('error')[0];
    expect(
      screen.queryByText(event?.type === 'error' ? event.message : ''),
    ).not.toBeInTheDocument();
    // Announced once, by the log; no nested alert.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    server.use(chatFromFixture('germany-dip'));
    await user.click(screen.getByRole('button', { name: t.error.retry }));
    await answerDone();
    expect(screen.getAllByText('force error')).toHaveLength(2);
  });

  it('keyboard: after a suggested question, focus stays in the composer', async () => {
    server.use(chatFromFixture('at-risk'));
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: t.suggestions.risks }));
    expect(screen.getByRole('textbox', { name: t.composer.label })).toHaveFocus();
  });

  it('keyboard: Stop returns focus to the field instead of a disabled Send', async () => {
    server.use(chatFromFixture('at-risk', { stallAfter: 3 }));
    const { user } = setup();
    await ask(user, 'Which markets are at risk?');
    await user.click(await screen.findByRole('button', { name: t.composer.stop }));
    expect(screen.getByRole('textbox', { name: t.composer.label })).toHaveFocus();
  });

  it('while an answer streams, Retry on an earlier error is disabled', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(chatFromFixture('error'));
    const { user } = setup();
    await ask(user, 'force error');
    const retry = await screen.findByRole('button', { name: t.error.retry });
    server.use(chatFromFixture('at-risk', { stallAfter: 3 }));
    await ask(user, 'Which markets are at risk?');
    await waitFor(() => {
      expect(retry).toBeDisabled();
    });
  });

  it('dataset failure: a source card explains the error instead of loading forever', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(datasetHandler({ status: 500 }), chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Why did Germany dip?');
    await answerDone();
    const [source] = within(screen.getByRole('list', { name: t.answer.sources })).getAllByRole(
      'button',
    );
    if (!source) throw new Error('no source');
    await user.hover(source);
    expect(await screen.findByText(en.errors.server)).toBeInTheDocument();
    expect(screen.queryByText(t.evidence.loading)).not.toBeInTheDocument();
  });

  it('New chat clears the conversation and is disabled when there is nothing to clear', async () => {
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    const newChat = screen.getByRole('button', { name: t.panel.newChat });
    expect(newChat).toHaveAttribute('aria-disabled', 'true');
    await ask(user, 'Tell me about the German market');
    await answerDone();
    await user.click(newChat);
    expect(screen.getByRole('heading', { name: t.panel.empty.title })).toBeInTheDocument();
    expect(screen.queryByText('Tell me about the German market')).not.toBeInTheDocument();
    expect(newChat).toHaveAttribute('aria-disabled', 'true');
    // Clicking it while empty does nothing.
    await user.click(newChat);
    expect(screen.getByRole('heading', { name: t.panel.empty.title })).toBeInTheDocument();
  });

  it('New chat moves focus to the composer', async () => {
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Tell me about the German market');
    await answerDone();
    await user.click(screen.getByRole('button', { name: t.panel.newChat }));
    expect(screen.getByRole('textbox', { name: t.composer.label })).toHaveFocus();
  });

  it('touch: New chat does not focus the composer (no on-screen keyboard)', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(pointer: coarse)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Tell me about the German market');
    await answerDone();
    const newChat = screen.getByRole('button', { name: t.panel.newChat });
    await user.click(newChat);
    expect(screen.getByRole('textbox', { name: t.composer.label })).not.toHaveFocus();
  });

  it('Copy of a low-confidence answer keeps "Treat as directional"', async () => {
    server.use(chatFromFixture('forecast-miss'));
    const { user } = setup();
    await ask(user, 'Where did we miss the forecast?');
    await answerDone();
    await user.click(screen.getByRole('button', { name: t.actions.copy }));
    expect(await navigator.clipboard.readText()).toContain(t.answer.directional);
  });

  it('Copy that the browser blocks shows an error toast', async () => {
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Why did Germany dip?');
    await answerDone();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    await user.click(screen.getByRole('button', { name: t.actions.copy }));
    expect(await screen.findByText(t.actions.copyFailed)).toBeInTheDocument();
    expect(screen.queryByText(t.actions.copied)).not.toBeInTheDocument();
  });

  it('Copy answer puts the text, its sources and confidence on the clipboard', async () => {
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Why did Germany dip?');
    await answerDone();
    await user.click(screen.getByRole('button', { name: t.actions.copy }));
    const copied = await navigator.clipboard.readText();
    const event = fixtureEvents('germany-dip').find((e) => e.type === 'done');
    const labels = event?.type === 'done' ? event.citations.map((c) => c.label ?? '') : [];
    expect(copied).toContain(tokensText('germany-dip'));
    for (const label of labels) expect(copied).toContain(label);
    expect(copied).toContain(t.answer.label);
    expect(await screen.findByText(t.actions.copied)).toBeInTheDocument();
    // "Copied" goes away on its own.
    await waitFor(
      () => {
        expect(screen.queryByText(t.actions.copied)).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('feedback: thumbs down asks why and logs the reason without the question text', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Why did Germany dip?');
    await answerDone();
    const down = screen.getByRole('button', { name: t.actions.notHelpful });
    await user.click(down);
    expect(down).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: t.actions.reasons.wrongNumbers }));
    // The reasons are gone; keyboard focus goes back to the button that opened them.
    expect(down).toHaveFocus();
    expect(info).toHaveBeenCalledWith(
      '[event] answer_feedback',
      expect.objectContaining({ rating: 'down', reason: 'wrongNumbers', confidence: 'high' }),
    );
    expect(JSON.stringify(info.mock.calls)).not.toContain('Why did Germany dip?');
    // A toast, not a grey line next to the icons.
    expect(await screen.findByText(t.actions.thanks)).toBeInTheDocument();
    // One rating per answer: both buttons are locked, nothing more is logged.
    const up = screen.getByRole('button', { name: t.actions.helpful });
    expect(up).toHaveAttribute('aria-disabled', 'true');
    expect(down).toHaveAttribute('aria-disabled', 'true');
    await user.click(up);
    await user.click(down);
    expect(info).toHaveBeenCalledTimes(1);
  });

  it('feedback: thumbs up is logged at once', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Why did Germany dip?');
    await answerDone();
    await user.click(screen.getByRole('button', { name: t.actions.helpful }));
    expect(info).toHaveBeenCalledWith(
      '[event] answer_feedback',
      expect.objectContaining({ rating: 'up' }),
    );
    expect(
      screen.queryByRole('button', { name: t.actions.reasons.wrongNumbers }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.actions.helpful }));
    expect(info).toHaveBeenCalledTimes(1);
  });

  it('feedback: thumbs down can still become thumbs up before a reason is picked', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    server.use(chatFromFixture('germany-dip'));
    const { user } = setup();
    await ask(user, 'Why did Germany dip?');
    await answerDone();
    await user.click(screen.getByRole('button', { name: t.actions.notHelpful }));
    await user.click(screen.getByRole('button', { name: t.actions.helpful }));
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(
      '[event] answer_feedback',
      expect.objectContaining({ rating: 'up' }),
    );
  });

  it('New chat shows a tooltip on hover', async () => {
    const { user } = setup();
    // Empty chat: the button is aria-disabled but still explains itself.
    await user.hover(screen.getByRole('button', { name: t.panel.newChat }));
    expect(await screen.findByRole('tooltip', { name: t.panel.newChat })).toBeInTheDocument();
  });

  it('answers restored after a reload are shown but not counted as new', async () => {
    server.use(chatFromFixture('germany-dip'));
    const first = setup();
    await ask(first.user, 'Why did Germany dip?');
    await answerDone();
    expect(first.onAnswerDone).toHaveBeenCalledTimes(1);
    cleanup();
    const second = setup();
    await answerDone();
    expect(screen.getAllByText('Why did Germany dip?').length).toBeGreaterThan(0);
    expect(second.onAnswerDone).not.toHaveBeenCalled();
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
      expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.getAll('markets')).toEqual([
        'de',
        'es',
        'it',
        'gb',
        'br',
        'fr',
      ]);
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
