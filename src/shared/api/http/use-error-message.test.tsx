import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';

import { NetworkError, TimeoutError } from './errors';
import { useErrorMessage } from './use-error-message';

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en-GB" messages={en}>
    {children}
  </NextIntlClientProvider>
);

describe('useErrorMessage', () => {
  it('turns any error into translated copy', () => {
    const { result } = renderHook(() => useErrorMessage(), { wrapper });
    expect(result.current(new TimeoutError())).toBe(en.errors.timeout);
    expect(result.current(new NetworkError())).toBe(en.errors.network);
    expect(result.current(new Error('boom'))).toBe(en.errors.unknown);
  });
});
