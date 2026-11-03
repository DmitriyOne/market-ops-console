import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import en from '@/shared/config/i18n/messages/en.json';

import ErrorPage from './error';

describe('route error page', () => {
  it('shows the translated title and retries on click', async () => {
    const reset = vi.fn();
    render(
      <NextIntlClientProvider locale="en-GB" messages={en}>
        <ErrorPage error={new Error('boom')} reset={reset} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: en.errorPage.title })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: en.errors.retry }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
