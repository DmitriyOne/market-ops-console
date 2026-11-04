import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { useStoredChoice } from './use-stored-choice';

const VIEWS = ['map', 'tiles', 'table'] as const;

describe('useStoredChoice', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('is unknown on the server', () => {
    function Probe() {
      return <>{String(useStoredChoice('mo:view', VIEWS, 'map')[0])}</>;
    }
    expect(renderToString(<Probe />)).toBe('null');
  });

  it('gives the fallback until a choice is made, and follows a changing fallback', () => {
    const { result, rerender } = renderHook(
      ({ fallback }: { fallback: (typeof VIEWS)[number] }) =>
        useStoredChoice('mo:view', VIEWS, fallback),
      { initialProps: { fallback: 'map' } },
    );
    expect(result.current[0]).toBe('map');
    rerender({ fallback: 'tiles' });
    expect(result.current[0]).toBe('tiles');
  });

  it('remembers a choice for the next mount', () => {
    const first = renderHook(() => useStoredChoice('mo:view', VIEWS, 'map'));
    act(() => {
      first.result.current[1]('table');
    });
    first.unmount();
    expect(renderHook(() => useStoredChoice('mo:view', VIEWS, 'map')).result.current[0]).toBe(
      'table',
    );
  });

  it('an unknown stored value falls back', () => {
    localStorage.setItem('mo:view', 'globe');
    expect(renderHook(() => useStoredChoice('mo:view', VIEWS, 'tiles')).result.current[0]).toBe(
      'tiles',
    );
  });
});
