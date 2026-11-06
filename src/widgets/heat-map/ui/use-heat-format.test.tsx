import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import type { HeatCell } from '@/entities/performance';
import { type AppLocale, deMessages, enMessages, formats, ruMessages } from '@/shared/config';

import { useHeatFormat } from './use-heat-format';

const cell: HeatCell = {
  period: '2026-03',
  value: 11.7,
  step: 0,
  anomaly: { period: '2026-03', type: 'dip', note: 'Fell.' },
  inWindow: false,
};

const nameIn = (locale: AppLocale, messages: typeof enMessages) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale={locale} messages={messages} formats={formats} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
  return renderHook(() => useHeatFormat('growth'), { wrapper }).result.current.cellName(cell);
};

describe('useHeatFormat cell name', () => {
  // The anomaly follows the value after a comma in every language (CLDR's
  // "unit" list has none in Russian, so it is a message, not format.list).
  it.each([
    ['en-GB', enMessages, /\), anomaly: Fell\.$/],
    ['de-DE', deMessages, /\), Auffälligkeit: Fell\.$/],
    ['ru-RU', ruMessages, /\), аномалия: Fell\.$/],
  ] as const)('%s', (locale, messages, pattern) => {
    expect(nameIn(locale, messages)).toMatch(pattern);
  });
});
