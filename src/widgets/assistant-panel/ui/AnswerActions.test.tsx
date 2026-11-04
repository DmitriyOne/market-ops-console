import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ChatMessage } from '@/features/ask-question';
import { enMessages as en, formats } from '@/shared/config';

import { AnswerActions } from './AnswerActions';

const t = en.assistant.actions;

const message: ChatMessage = {
  id: 'a1',
  question: 'Why Germany?',
  text: 'Because.',
  status: 'done',
  kind: 'normal',
  citations: [],
  confidence: 'high',
  error: null,
  notice: null,
};

describe('AnswerActions', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('a second Copy keeps "Copied" for a full 2 s from that click', async () => {
    vi.useFakeTimers();
    Object.assign(navigator, { clipboard: { writeText: vi.fn(() => Promise.resolve()) } });
    render(
      <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
        <AnswerActions message={message} getCopyText={() => 'Because.'} />
      </NextIntlClientProvider>,
    );
    const copy = screen.getByRole('button', { name: t.copy });
    await act(async () => {
      fireEvent.click(copy);
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(1500);
      fireEvent.click(copy);
      await Promise.resolve();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(t.copied)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText(t.copied)).not.toBeInTheDocument();
  });
});
