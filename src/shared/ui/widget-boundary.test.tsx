import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TimeoutError } from '@/shared/api';
import { enMessages as en } from '@/shared/config';
import { logError } from '@/shared/lib';

import { WidgetBoundary } from './widget-boundary';

let shouldFail = true;
function FlakyWidget() {
  if (shouldFail) throw new TimeoutError();
  return <p>{'widget content'}</p>;
}

function renderPage() {
  render(
    <NextIntlClientProvider locale="en-GB" messages={en}>
      <WidgetBoundary>
        <FlakyWidget />
      </WidgetBoundary>
      <p>{'other widget'}</p>
    </NextIntlClientProvider>,
  );
}

describe('WidgetBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    shouldFail = true;
  });

  it('contains a crash to its widget, explains it and logs it', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPage();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(en.errors.sectionTitle);
    expect(alert).toHaveTextContent(en.errors.timeout);
    expect(screen.getByText('other widget')).toBeInTheDocument();
    expect(log).toHaveBeenCalledWith('[ui]', expect.objectContaining({ code: 'unknown' }));
  });

  it('renders the widget again after Retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPage();
    shouldFail = false;
    await userEvent.click(screen.getByRole('button', { name: en.errors.retry }));
    expect(screen.getByText('widget content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('logs a failed query once and refetches it on Retry', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let calls = 0;
    function DataWidget() {
      const { data } = useSuspenseQuery({
        queryKey: ['widget-data'],
        queryFn: () => {
          calls += 1;
          return calls === 1 ? Promise.reject(new TimeoutError()) : Promise.resolve('fresh data');
        },
        retry: false,
      });
      return <p>{data}</p>;
    }
    // Same wiring as the app's QueryClient: the cache logs failed queries.
    const client = new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          logError(error, { scope: 'query' });
        },
      }),
    });
    render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en-GB" messages={en}>
          <WidgetBoundary>
            <DataWidget />
          </WidgetBoundary>
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    await screen.findByRole('alert');
    // Our own log entries start with "[scope]"; React adds its own dev message.
    const ours = log.mock.calls.filter(
      ([first]) => typeof first === 'string' && first.startsWith('['),
    );
    expect(ours).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: en.errors.retry }));
    expect(await screen.findByText('fresh data')).toBeInTheDocument();
  });
});
