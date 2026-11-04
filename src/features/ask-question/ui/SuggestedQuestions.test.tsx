import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { deMessages as de } from '@/shared/config';

import { SUGGESTED_QUESTIONS } from '../config/suggestions';
import { SuggestedQuestions } from './SuggestedQuestions';

describe('SuggestedQuestions', () => {
  it('shows translated labels and sends the English question', async () => {
    const onAsk = vi.fn();
    render(
      <NextIntlClientProvider locale="de-DE" messages={de}>
        <SuggestedQuestions onAsk={onAsk} />
      </NextIntlClientProvider>,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    await userEvent.click(screen.getByRole('button', { name: de.assistant.suggestions.germany }));
    expect(onAsk).toHaveBeenCalledWith(SUGGESTED_QUESTIONS[1]?.question);
  });
});
