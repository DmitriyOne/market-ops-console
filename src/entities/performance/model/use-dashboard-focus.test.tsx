import { act, renderHook } from '@testing-library/react';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { resolveCitation } from './citation';
import { ds } from './test-dataset';
import { useDashboardFocus } from './use-dashboard-focus';

function setup(searchParams = '') {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      {children}
    </NuqsTestingAdapter>
  );
  const { result } = renderHook(() => useDashboardFocus(), { wrapper });
  return { result, onUrlUpdate };
}

describe('useDashboardFocus', () => {
  it('focus writes the cited scope and period with a history entry', async () => {
    const { result, onUrlUpdate } = setup('?markets=es,fr&product=nuvora&range=3m');
    act(() => {
      result.current.focus(resolveCitation(ds, { marketId: 'de', period: '2026-03' }));
    });
    await vi.waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.queryString).toBe('?region=eu&market=de&period=2026-03');
    expect(event?.options.history).toBe('push');
  });

  it('highlight writes the market list with a history entry', async () => {
    const { result, onUrlUpdate } = setup();
    act(() => {
      result.current.highlight(['es', 'fr']);
    });
    await vi.waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.searchParams.get('markets')).toBe('es,fr');
    expect(event?.options.history).toBe('push');
  });

  it('highlight resets an earlier focus to the portfolio, latest month', async () => {
    const { result, onUrlUpdate } = setup(
      '?region=eu&market=de&product=nuvora&period=2026-03&range=3m',
    );
    act(() => {
      result.current.highlight(['es', 'fr']);
    });
    await vi.waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    // The data block it comes from is the whole portfolio in the latest month.
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].queryString).toBe('?markets=es,fr');
  });
});
