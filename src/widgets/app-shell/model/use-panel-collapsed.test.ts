import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyPanelCollapsed, PANEL_COLLAPSED_SCRIPT } from './panel-collapsed-script';
import { usePanelCollapsed } from './use-panel-collapsed';

const attr = () => document.documentElement.hasAttribute('data-assistant-collapsed');

describe('usePanelCollapsed', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-assistant-collapsed');
  });
  afterEach(() => {
    document.documentElement.removeAttribute('data-assistant-collapsed');
  });

  it('mirrors the state on <html> so CSS applies it', () => {
    const { result } = renderHook(() => usePanelCollapsed());
    act(() => {
      result.current[1](true);
    });
    expect(attr()).toBe(true);
    expect(localStorage.getItem('mo:assistant-collapsed')).toBe('1');
    act(() => {
      result.current[1](false);
    });
    expect(attr()).toBe(false);
  });

  it('the pre-paint script applies a remembered collapse before React runs', () => {
    localStorage.setItem('mo:assistant-collapsed', '1');
    applyPanelCollapsed();
    expect(attr()).toBe(true);
    // The layout inlines exactly this function in <head>.
    expect(PANEL_COLLAPSED_SCRIPT).toContain('data-assistant-collapsed');
  });

  it('the pre-paint script leaves the panel open when nothing is stored', () => {
    applyPanelCollapsed();
    expect(attr()).toBe(false);
  });
});
