import { renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { useModeAttribute } from './use-mode-attribute';

const mode = () => document.documentElement.getAttribute('data-mode');

describe('useModeAttribute', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-mode');
  });

  it('keeps the <html> mark in step with the URL once the page runs', () => {
    const { unmount } = renderHook(useModeAttribute, {
      wrapper: withNuqsTestingAdapter({ searchParams: '?mode=analyst' }),
    });
    expect(mode()).toBe('analyst');
    unmount();
    renderHook(useModeAttribute, { wrapper: withNuqsTestingAdapter({ searchParams: '' }) });
    expect(mode()).toBeNull();
  });
});
