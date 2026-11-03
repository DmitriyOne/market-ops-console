import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';

import ErrorPage from './error';

describe('route error page', () => {
  it('shows the translated title and retries on click', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
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

  it('logs the route error through logError', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = Object.assign(new Error('render failed'), { digest: 'abc123' });
    render(
      <NextIntlClientProvider locale="en-GB" messages={en}>
        <ErrorPage error={error} reset={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(log).toHaveBeenCalledWith('[ui]', expect.objectContaining({ digest: 'abc123', error }));
  });
});
