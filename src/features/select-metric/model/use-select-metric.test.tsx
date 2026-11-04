import { act, renderHook, waitFor } from '@testing-library/react';
import type { UrlUpdateEvent } from 'nuqs/adapters/testing';
import { type ReactNode, Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { datasetHandler, server, TestProviders } from '@/shared/lib/test';

import { useSelectMetric } from './use-select-metric';

async function setup(searchParams = '') {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <Suspense>{children}</Suspense>
    </TestProviders>
  );
  const { result } = renderHook(() => useSelectMetric(), { wrapper });
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

describe('useSelectMetric', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('writes the metric without a history entry (cosmetic, spec §6)', async () => {
    const { result, last } = await setup('?mode=analyst&region=eu');
    act(() => {
      result.current('growth');
    });
    const event = await last();
    expect(event?.queryString).toBe('?mode=analyst&region=eu&kpi=growth');
    expect(event?.options.history).toBe('replace');
  });

  it('the default metric is not written', async () => {
    const { result, last } = await setup('?mode=analyst&kpi=growth');
    act(() => {
      result.current('status');
    });
    expect((await last())?.queryString).toBe('?mode=analyst');
  });
});
