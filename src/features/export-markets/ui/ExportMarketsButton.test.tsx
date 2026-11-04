import { screen } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { ExportMarketsButton } from './ExportMarketsButton';

const downloadText = vi.hoisted(() => vi.fn());
vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib')>()),
  downloadText,
}));

describe('ExportMarketsButton', () => {
  beforeEach(() => {
    downloadText.mockClear();
    server.use(datasetHandler());
  });

  it('saves the rows as shown under a name with the period and window', async () => {
    const { user } = renderWithProviders(
      <Suspense>
        <ExportMarketsButton />
      </Suspense>,
      { searchParams: '?mode=analyst&range=3m&markets=de&markets=es&sort=-units' },
    );
    await user.click(await screen.findByRole('button', { name: en.exportMarkets.button }));
    expect(downloadText).toHaveBeenCalledWith(
      'markets-2026-05-3m.csv',
      expect.stringContaining('\r\nde,Germany,'),
      'text/csv;charset=utf-8',
    );
    const csv = String(downloadText.mock.calls[0]?.[1]);
    expect(csv.trimEnd().split('\r\n')).toHaveLength(3);
  });

  it('nothing to save: the button is disabled', async () => {
    renderWithProviders(
      <Suspense>
        <ExportMarketsButton />
      </Suspense>,
      { searchParams: '?mode=analyst&region=apac&markets=de' },
    );
    expect(await screen.findByRole('button', { name: en.exportMarkets.button })).toBeDisabled();
  });
});
