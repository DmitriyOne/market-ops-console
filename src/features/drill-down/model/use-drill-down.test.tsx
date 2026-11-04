import { act, renderHook, waitFor } from '@testing-library/react';
import type { UrlUpdateEvent } from 'nuqs/adapters/testing';
import { type ReactNode, Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { datasetHandler, server, TestProviders } from '@/shared/lib/test';

import { useDrillDown } from './use-drill-down';

async function setup(searchParams = '') {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <Suspense>{children}</Suspense>
    </TestProviders>
  );
  const { result } = renderHook(() => useDrillDown(), { wrapper });
  await waitFor(() => {
    expect(result.current).not.toBeNull();
  });
  const last = async () => {
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    return onUrlUpdate.mock.calls.at(-1)?.[0];
  };
  return { result, last };
}

describe('useDrillDown', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('a market brings its region and keeps the period, with a history entry', async () => {
    const { result, last } = await setup('?period=2026-03&range=3m&markets=es');
    act(() => {
      result.current.toMarket('de');
    });
    const event = await last();
    expect(Object.fromEntries(event?.searchParams ?? [])).toEqual({
      region: 'eu',
      market: 'de',
      period: '2026-03',
      range: '3m',
    });
    expect(event?.options.history).toBe('push');
  });

  it('a region clears the market and product below it', async () => {
    const { result, last } = await setup('?region=eu&market=de&product=veltrix');
    act(() => {
      result.current.toRegion('apac');
    });
    expect((await last())?.queryString).toBe('?region=apac');
  });

  it('a product is the last step under the market', async () => {
    const { result, last } = await setup('?region=eu&market=de&markets=de');
    act(() => {
      result.current.toProduct('veltrix');
    });
    expect((await last())?.queryString).toBe('?region=eu&market=de&product=veltrix');
  });

  it('portfolio clears the whole drill path but not the period', async () => {
    const { result, last } = await setup('?region=eu&market=de&period=2026-01');
    act(() => {
      result.current.toPortfolio();
    });
    expect((await last())?.queryString).toBe('?period=2026-01');
  });
});
