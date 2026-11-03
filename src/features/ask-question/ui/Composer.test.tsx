import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { CHAT_QUESTION_MAX_LENGTH } from '@/shared/api';
import { enMessages as en } from '@/shared/config';

import { Composer } from './Composer';

function setup(isStreaming = false) {
  const onAsk = vi.fn();
  const onStop = vi.fn();
  const view = render(
    <NextIntlClientProvider locale="en-GB" messages={en}>
      <Composer isStreaming={isStreaming} onAsk={onAsk} onStop={onStop} />
    </NextIntlClientProvider>,
  );
  const field = screen.getByRole('textbox', { name: en.assistant.composer.label });
  return { onAsk, onStop, field, user: userEvent.setup(), ...view };
}

describe('Composer', () => {
  it('Enter sends the trimmed text and clears the field', async () => {
    const { onAsk, field, user } = setup();
    await user.type(field, '  Why did Germany dip?  {Enter}');
    expect(onAsk).toHaveBeenCalledWith('Why did Germany dip?');
    expect(field).toHaveValue('');
  });

  it('Shift+Enter inserts a newline instead of sending', async () => {
    const { onAsk, field, user } = setup();
    await user.type(field, 'one{Shift>}{Enter}{/Shift}two');
    expect(onAsk).not.toHaveBeenCalled();
    expect(field).toHaveValue('one\ntwo');
  });

  it('blank text cannot be sent and the reason is announced', async () => {
    const { onAsk, field, user } = setup();
    await user.type(field, '   {Enter}');
    expect(onAsk).not.toHaveBeenCalled();
    const send = screen.getByRole('button', { name: en.assistant.composer.send });
    expect(send).toBeDisabled();
    expect(send).toHaveAccessibleDescription(en.assistant.composer.blankReason);
  });

  it('text over the limit cannot be sent and the counter explains why', async () => {
    const { onAsk, field, user } = setup();
    await user.click(field);
    await user.paste('a'.repeat(CHAT_QUESTION_MAX_LENGTH + 1));
    await user.keyboard('{Enter}');
    expect(onAsk).not.toHaveBeenCalled();
    const send = screen.getByRole('button', { name: en.assistant.composer.send });
    expect(send).toBeDisabled();
    expect(screen.getByText('501 / 500')).toBeInTheDocument();
    expect(send).toHaveAccessibleDescription(/up to 500 characters/);
  });

  it('shows the counter only from 450 characters', async () => {
    const { field, user } = setup();
    await user.click(field);
    await user.paste('a'.repeat(449));
    expect(screen.queryByText('449 / 500')).not.toBeInTheDocument();
    await user.type(field, 'a');
    expect(screen.getByText('450 / 500')).toBeInTheDocument();
  });

  it('while streaming: the field is read-only, Esc and the Stop button stop', async () => {
    const { onStop, onAsk, field, user } = setup(true);
    expect(field).toHaveAttribute('readonly');
    expect(field).toHaveAttribute('aria-disabled', 'true');
    field.focus();
    await user.keyboard('{Escape}');
    expect(onStop).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: en.assistant.composer.stop }));
    expect(onStop).toHaveBeenCalledTimes(2);
    expect(onAsk).not.toHaveBeenCalled();
  });

  it.each(['Какие рынки под риском?', 'Märkte mit Risiko'])(
    'English-only notice for non-English text: %s',
    async (text) => {
      const { onAsk, field, user } = setup();
      await user.type(field, text);
      const notice = screen.getByText(en.assistant.composer.englishOnly);
      expect(notice.closest('[aria-live="polite"]')).not.toBeNull();
      await user.keyboard('{Enter}');
      expect(onAsk).toHaveBeenCalledWith(text);
    },
  );

  it('describes the field with the English-only notice and the length reason', async () => {
    const { field, user } = setup();
    await user.type(field, 'Märkte');
    expect(field).toHaveAccessibleDescription(en.assistant.composer.englishOnly);
    await user.clear(field);
    await user.click(field);
    await user.paste('a'.repeat(CHAT_QUESTION_MAX_LENGTH + 1));
    expect(field).toHaveAccessibleDescription(/up to 500 characters/);
  });

  it('shows no English-only notice for English text', async () => {
    const { field, user } = setup();
    await user.type(field, 'Which markets are at risk?');
    expect(screen.queryByText(en.assistant.composer.englishOnly)).not.toBeInTheDocument();
  });
});
