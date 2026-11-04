import { act, renderHook, waitFor } from '@testing-library/react';
import type { UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TestProviders } from '@/shared/lib/test';

import { useResetView } from './use-reset-view';

describe('useResetView', () => {
  it('clears every dashboard param in one history step', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestProviders
        searchParams="?region=eu&market=de&product=veltrix&period=2026-03&range=3m&mode=analyst&markets=de&tab=assistant"
        onUrlUpdate={onUrlUpdate}
      >
        {children}
      </TestProviders>
    );
    const { result } = renderHook(() => useResetView(), { wrapper });
    act(() => {
      result.current();
    });
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    const last = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(last?.queryString).toBe('');
    expect(last?.options.history).toBe('push');
  });

  it('on the clean view it adds no history step', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestProviders onUrlUpdate={onUrlUpdate}>{children}</TestProviders>
    );
    const { result } = renderHook(() => useResetView(), { wrapper });
    act(() => {
      result.current();
    });
    await new Promise((r) => setTimeout(r, 100));
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });
});
