import { act, renderHook } from '@testing-library/react';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useSection } from './use-section';

function setup(searchParams = '') {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      {children}
    </NuqsTestingAdapter>
  );
  return { ...renderHook(() => useSection(), { wrapper }), onUrlUpdate };
}

describe('useSection', () => {
  it('defaults to overview', () => {
    expect(setup().result.current[0]).toBe('overview');
  });

  it('reads the tab from the URL and ignores unknown values', () => {
    expect(setup('?tab=assistant').result.current[0]).toBe('assistant');
    expect(setup('?tab=alerts').result.current[0]).toBe('alerts');
    expect(setup('?tab=nope').result.current[0]).toBe('overview');
  });

  it('switching writes tab with a history entry', async () => {
    const { result, onUrlUpdate } = setup();
    act(() => {
      result.current[1]('assistant');
    });
    await vi.waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.queryString).toBe('?tab=assistant');
    expect(event?.options.history).toBe('push');
  });

  it('closing the alerts sheet replaces the entry', async () => {
    const { result, onUrlUpdate } = setup('?tab=alerts');
    act(() => {
      result.current[1]('overview', { history: 'replace' });
    });
    await vi.waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.queryString).toBe('');
    expect(event?.options.history).toBe('replace');
  });
});
