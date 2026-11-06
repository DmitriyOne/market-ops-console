import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';

import { SentryTestPage } from './SentryTestPage';

vi.mock('@/shared/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/config')>()),
  Link: ({ href, children }: { href: string; children: string }) => <a href={href}>{children}</a>,
}));

const items = en.sentryTest.items;

const renderPage = (sentryOn: boolean) =>
  render(
    <NextIntlClientProvider locale="en-GB" messages={en}>
      <SentryTestPage sentryOn={sentryOn} />
    </NextIntlClientProvider>,
  );

describe('SentryTestPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offers every kind of error, the server one as a link', () => {
    renderPage(true);
    expect(
      screen.getByRole('heading', { level: 1, name: en.sentryTest.title }),
    ).toBeInTheDocument();
    for (const key of [
      'clientError',
      'renderError',
      'handled',
      'rejection',
      'warning',
      'apiError',
      'trace',
    ] as const) {
      expect(screen.getByRole('button', { name: items[key].label })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: items.serverError.label })).toHaveAttribute(
      'href',
      '/sentry-test/server',
    );
    expect(screen.queryByText(en.sentryTest.off)).not.toBeInTheDocument();
  });

  it('says when Sentry is off', () => {
    renderPage(false);
    expect(screen.getByText(en.sentryTest.off)).toBeInTheDocument();
  });

  it('logs a handled error and a warning, and says where to look', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderPage(true);
    await userEvent.click(screen.getByRole('button', { name: items.handled.label }));
    expect(error).toHaveBeenCalledWith(
      '[ui]',
      expect.objectContaining({ message: 'Sentry test: handled error', source: 'sentry-test' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(items.handled.label);
    await userEvent.click(screen.getByRole('button', { name: items.warning.label }));
    expect(warn).toHaveBeenCalledWith('[ui]', 'sentry_test_warning', { source: 'sentry-test' });
  });

  it('shows a busy button while the trace runs and ignores a second click', async () => {
    renderPage(true);
    const button = screen.getByRole('button', { name: items.trace.label });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent(en.sentryTest.sending);
    await userEvent.click(button);
    await waitFor(() => {
      expect(button).not.toHaveAttribute('aria-busy');
    });
    expect(button).toHaveTextContent(items.trace.label);
    expect(screen.getByRole('status')).toHaveTextContent(items.trace.label);
  });
});
