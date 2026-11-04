import { screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { ExportMenu } from './ExportMenu';

const { downloadBlob, downloadText } = vi.hoisted(() => ({
  downloadBlob: vi.fn(),
  downloadText: vi.fn(),
}));
vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib')>()),
  downloadBlob,
  downloadText,
}));

const t = en.exportMarkets;
const SEARCH = '?mode=analyst&range=3m&markets=de&markets=es&sort=-units';

function setup(searchParams = SEARCH) {
  return renderWithProviders(
    <Suspense>
      <ExportMenu />
    </Suspense>,
    { searchParams },
  );
}

describe('ExportMenu', () => {
  beforeEach(() => {
    downloadBlob.mockClear();
    downloadText.mockClear();
    server.use(datasetHandler());
  });

  it('CSV saves the rows as shown', async () => {
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: t.button }));
    await user.click(await screen.findByRole('menuitem', { name: /^CSV/ }));
    expect(downloadText).toHaveBeenCalledWith(
      'markets-2026-05-3m.csv',
      expect.stringContaining('\r\nde,DE,Germany,'),
      'text/csv;charset=utf-8',
    );
    expect(String(downloadText.mock.calls[0]?.[1]).trimEnd().split('\r\n')).toHaveLength(3);
  });

  it('Excel saves a workbook with the same name', async () => {
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: t.button }));
    await user.click(await screen.findByRole('menuitem', { name: /^Excel/ }));
    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledWith('markets-2026-05-3m.xlsx', expect.any(Blob));
    });
  });

  it('nothing to save: the button is disabled', async () => {
    setup('?mode=analyst&region=apac&markets=de');
    expect(await screen.findByRole('button', { name: t.button })).toBeDisabled();
  });
});
