import { act, renderHook, waitFor } from '@testing-library/react';
import type { UrlUpdateEvent } from 'nuqs/adapters/testing';
import { type ReactNode, Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { datasetHandler, server, TestProviders } from '@/shared/lib/test';

import { useMarketSelection } from './use-market-selection';

async function setup(searchParams = '') {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <Suspense>{children}</Suspense>
    </TestProviders>
  );
  const { result } = renderHook(() => useMarketSelection(), { wrapper });
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

describe('useMarketSelection', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('toggle adds a market as a history entry (selection, spec §6)', async () => {
    const { result, last } = await setup('?mode=analyst&markets=de');
    expect(result.current.selected).toEqual(['de']);
    act(() => {
      result.current.toggle('es');
    });
    const event = await last();
    expect(event?.queryString).toBe('?mode=analyst&markets=de&markets=es');
    expect(event?.options.history).toBe('push');
  });

  it('toggling the last market removes the param', async () => {
    const { result, last } = await setup('?mode=analyst&markets=de');
    act(() => {
      result.current.toggle('de');
    });
    expect((await last())?.queryString).toBe('?mode=analyst');
  });

  it('set writes the list; clear removes it', async () => {
    const { result, last } = await setup('?mode=analyst');
    act(() => {
      result.current.set(['fr', 'it']);
    });
    expect((await last())?.queryString).toBe('?mode=analyst&markets=fr&markets=it');
    act(() => {
      result.current.clear();
    });
    expect((await last())?.queryString).toBe('?mode=analyst');
  });
});
