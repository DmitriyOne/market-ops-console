import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { enMessages as en, ruMessages as ru } from '@/shared/config';

import { RouteErrorPage } from './RouteErrorPage';

vi.mock('@/shared/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/config')>()),
  Link: ({ href, children }: { href: string; children: string }) => <a href={href}>{children}</a>,
}));

const renderPage = (error: Error & { digest?: string }, reset = vi.fn(), messages = en) =>
  render(
    <NextIntlClientProvider locale="en-GB" messages={messages}>
      <RouteErrorPage error={error} reset={reset} />
    </NextIntlClientProvider>,
  );

describe('RouteErrorPage', () => {
  it('shows the translated title and retries on click', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reset = vi.fn();
    renderPage(new Error('boom'), reset);
    expect(screen.getByRole('heading', { level: 1, name: en.errorPage.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.errorPage.home })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    await userEvent.click(screen.getByRole('button', { name: en.errors.retry }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('shows the error ID when there is one and logs the error', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = Object.assign(new Error('render failed'), { digest: 'abc123' });
    renderPage(error);
    expect(screen.getByText('Error ID: abc123')).toBeInTheDocument();
    expect(log).toHaveBeenCalledWith('[ui]', expect.objectContaining({ digest: 'abc123', error }));
  });

  it('has no error ID line without a digest, in any language', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPage(new Error('boom'), vi.fn(), ru);
    expect(screen.getByRole('heading', { level: 1, name: ru.errorPage.title })).toBeInTheDocument();
    expect(screen.queryByText(/Код ошибки/)).not.toBeInTheDocument();
  });
});
