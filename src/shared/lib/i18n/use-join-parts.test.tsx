import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { enMessages } from '@/shared/config';

import { useJoinParts } from './use-join-parts';

describe('useJoinParts', () => {
  it("joins with the dictionary's separator and drops empty parts", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider locale="en-GB" messages={enMessages}>
        {children}
      </NextIntlClientProvider>
    );
    const { result } = renderHook(() => useJoinParts(), { wrapper });
    expect(result.current(['Veltrix', null, 'Germany', '', false, 'Mar 2026'])).toBe(
      'Veltrix · Germany · Mar 2026',
    );
  });
});
