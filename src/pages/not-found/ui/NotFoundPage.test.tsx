import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { type AppLocale, deMessages as de, enMessages as en } from '@/shared/config';

import { NotFoundPage } from './NotFoundPage';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/de-DE/dashbord',
}));
vi.mock('@/shared/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/config')>()),
  Link: ({ href, children }: { href: string; children: string }) => <a href={href}>{children}</a>,
}));

const renderIn = (locale: AppLocale, messages: typeof en) =>
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NotFoundPage />
    </NextIntlClientProvider>,
  );

describe('NotFoundPage', () => {
  it('says what happened, shows the address and links to the dashboard', () => {
    renderIn('en-GB', en);
    expect(screen.getByRole('heading', { level: 1, name: en.notFound.title })).toBeInTheDocument();
    expect(screen.getByText('/de-DE/dashbord', { exact: false })).toHaveTextContent(
      'Address not found: /de-DE/dashbord',
    );
    expect(screen.getByRole('link', { name: en.notFound.home })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(document.title).toBe('Page not found · Market Ops Console');
  });

  it('speaks the page language', () => {
    renderIn('de-DE', de);
    expect(screen.getByRole('heading', { level: 1, name: de.notFound.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: de.notFound.home })).toBeInTheDocument();
  });
});
