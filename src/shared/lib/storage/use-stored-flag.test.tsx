import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useStoredFlag } from './use-stored-flag';

describe('useStoredFlag', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('is unknown on the server, so a caller can wait instead of showing the default', () => {
    function Probe() {
      return <>{String(useStoredFlag('mo:test')[0])}</>;
    }
    expect(renderToString(<Probe />)).toBe('null');
  });

  it('is off until set', () => {
    const { result } = renderHook(() => useStoredFlag('mo:test'));
    expect(result.current[0]).toBe(false);
  });

  it('remembers the choice for the next mount', () => {
    const first = renderHook(() => useStoredFlag('mo:test'));
    act(() => {
      first.result.current[1](true);
    });
    expect(first.result.current[0]).toBe(true);
    first.unmount();
    expect(renderHook(() => useStoredFlag('mo:test')).result.current[0]).toBe(true);
  });

  it('every user of the same key sees the change', () => {
    const a = renderHook(() => useStoredFlag('mo:test'));
    const b = renderHook(() => useStoredFlag('mo:test'));
    act(() => {
      a.result.current[1](true);
    });
    expect(b.result.current[0]).toBe(true);
  });

  it('keys are separate', () => {
    const a = renderHook(() => useStoredFlag('mo:a'));
    const b = renderHook(() => useStoredFlag('mo:b'));
    act(() => {
      a.result.current[1](true);
    });
    expect(b.result.current[0]).toBe(false);
  });

  it('blocked storage still works for this visit', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useStoredFlag('mo:test'));
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
  });

  it('a full storage (writes fail, reads work) still switches for this visit', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useStoredFlag('mo:full'));
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
  });
});
