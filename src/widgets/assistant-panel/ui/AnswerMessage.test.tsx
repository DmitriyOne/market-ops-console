import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import rawData from '@/data/data.json';
import { inCurrency } from '@/entities/performance';
import type { ChatMessage } from '@/features/ask-question';
import { datasetSchema } from '@/shared/api';
import { enMessages as en } from '@/shared/config';
import { renderWithProviders } from '@/shared/lib/test';

import { AnswerMessage } from './AnswerMessage';

const ds = datasetSchema.parse(rawData);
const t = en.assistant;

const answer = (text: string): ChatMessage => ({
  id: 'a1',
  question: 'How is Germany doing?',
  text,
  status: 'done',
  kind: 'normal',
  citations: [{ marketId: 'de', period: ds.meta.latestPeriod, label: 'Germany' }],
  confidence: 'high',
  error: null,
  notice: null,
});

function renderAnswer(text: string, currency?: 'EUR' | 'GBP') {
  renderWithProviders(
    <AnswerMessage
      message={answer(text)}
      ds={currency ? inCurrency(ds, currency) : ds}
      onAsk={vi.fn()}
      onRetry={vi.fn()}
      onSource={vi.fn()}
      onHighlight={vi.fn()}
    />,
    { searchParams: currency ? `?currency=${currency}` : '' },
  );
}

describe('AnswerMessage in another currency (ADR 0017)', () => {
  it('says the answer quotes USD when it names dollars and euros are chosen', () => {
    renderAnswer('Germany made $1.7M in May.', 'EUR');
    expect(
      screen.getByText('Amounts in this answer are in USD, as the data; the dashboard shows EUR.'),
    ).toBeInTheDocument();
  });

  it('no note in USD, or when the answer quotes no amount', () => {
    renderAnswer('Germany made $1.7M in May.');
    expect(screen.queryByText(/Amounts in this answer/)).toBeNull();
    renderAnswer('Germany is off track.', 'GBP');
    expect(screen.queryByText(/Amounts in this answer/)).toBeNull();
  });

  it("the source's evidence card shows revenue in the chosen currency", async () => {
    renderAnswer('Germany is off track.', 'GBP');
    await userEvent.tab();
    expect(await screen.findByText(t.evidence.clickHint)).toBeInTheDocument();
    // Germany, May 2026: 1,676,586 $ × 0.74299 = £1,245,687 → "£1.2m"
    expect(screen.getByText('£1.2m')).toBeInTheDocument();
  });
});
