import { renderHook, waitFor } from '@testing-library/react';
import type { UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { datasetHandler, server, TestProviders } from '@/shared/lib/test';

import { useDashboard } from './use-dashboard';

function setup(searchParams: string) {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <Suspense>{children}</Suspense>
    </TestProviders>
  );
  const { result } = renderHook(() => useDashboard(), { wrapper });
  return { result, onUrlUpdate };
}

describe('useDashboard', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('gives the dataset and the checked view', async () => {
    const { result } = setup('?market=de&period=2026-03');
    await waitFor(() => {
      expect(result.current.state.scope).toEqual({ regionId: 'eu', marketId: 'de' });
    });
    expect(result.current.state.period).toBe('2026-03');
    expect(result.current.ds.markets).toHaveLength(13);
  });

  it('rewrites a bad URL in place, without a history entry, and leaves a breadcrumb', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const { onUrlUpdate } = setup('?region=apac&market=de&range=7m');
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.queryString).toBe('?region=eu&market=de');
    expect(event?.options.history).toBe('replace');
    expect(info).toHaveBeenCalledWith('[event] url_fixed', { params: ['region', 'range'] });
    info.mockRestore();
  });

  it('many widgets reading one broken link: the repair is logged once', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestProviders searchParams="?currency=eur&range=9m" onUrlUpdate={onUrlUpdate}>
        <Suspense>{children}</Suspense>
      </TestProviders>
    );
    // Four readers, like the widgets of one page.
    renderHook(() => [useDashboard(), useDashboard(), useDashboard(), useDashboard()], { wrapper });
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].queryString).toBe('?currency=EUR');
    const logged = info.mock.calls.filter(([message]) => message === '[event] url_fixed');
    expect(logged).toEqual([['[event] url_fixed', { params: ['range', 'currency'] }]]);
    info.mockRestore();
  });

  it('reads repeated markets keys, the form a shared link and the locale switch keep', async () => {
    const { result } = setup('?markets=de&markets=es');
    await waitFor(() => {
      expect(result.current.state.selected).toEqual(['de', 'es']);
    });
  });

  it('leaves a valid URL untouched', async () => {
    const { result, onUrlUpdate } = setup('?region=eu');
    await waitFor(() => {
      expect(result.current.state.scope).toEqual({ regionId: 'eu' });
    });
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });
});
