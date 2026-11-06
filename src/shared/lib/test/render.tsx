import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { enMessages, formats } from '@/shared/config';
import { TooltipProvider } from '@/shared/ui';

import { CurrencyFormats } from '../currency';

/** Providers the app gives every page: query client, intl (en-GB) in the stored currency, URL state, tooltips. */
export function TestProviders({
  children,
  searchParams = '',
  onUrlUpdate,
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
}: {
  children: ReactNode;
  searchParams?: string;
  onUrlUpdate?: (event: UrlUpdateEvent) => void;
  client?: QueryClient;
}) {
  return (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en-GB" messages={enMessages} formats={formats} timeZone="UTC">
        <CurrencyFormats>
          <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
            <TooltipProvider>{children}</TooltipProvider>
          </NuqsTestingAdapter>
        </CurrencyFormats>
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

/** Render with the app providers; `lastUrl()` is the query string of the latest URL write. */
export function renderWithProviders(ui: ReactNode, { searchParams = '' } = {}) {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const view = render(
    <TestProviders searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      {ui}
    </TestProviders>,
  );
  const lastUpdate = () => onUrlUpdate.mock.calls.at(-1)?.[0];
  return { ...view, onUrlUpdate, lastUpdate, user: userEvent.setup() };
}
