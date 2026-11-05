import { screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import raw from '@/data/data.json';
import { inCurrency, marketsTable } from '@/entities/performance';
import { datasetSchema } from '@/shared/api';
import { enMessages as en, USD_RATES } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import * as xlsx from '../model/markets-xlsx';
import { ExportMenu } from './ExportMenu';

const { downloadBlob, downloadText, logError, marketsXlsx, toastError } = vi.hoisted(() => ({
  toastError: vi.fn(),
  downloadBlob: vi.fn(),
  downloadText: vi.fn(),
  logError: vi.fn(),
  marketsXlsx: vi.fn<typeof import('../model/markets-xlsx').marketsXlsx>(),
}));
vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib')>()),
  downloadBlob,
  downloadText,
  logError,
}));
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/ui')>()),
  toast: { error: toastError },
}));
vi.mock('../model/markets-xlsx', async (importOriginal) => ({
  ...(await importOriginal<typeof xlsx>()),
  marketsXlsx,
}));
// The workbook itself is tested in markets-xlsx.test.ts; building a real one
// here (ExcelJS) is slow under a full parallel run and made this file flaky.
const WORKBOOK = new Blob(['xlsx']);

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
    downloadBlob.mockReset();
    downloadText.mockReset();
    logError.mockReset();
    toastError.mockReset();
    marketsXlsx.mockReset().mockResolvedValue(WORKBOOK);
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
      expect(downloadBlob).toHaveBeenCalledWith('markets-2026-05-3m.xlsx', WORKBOOK);
    });
    // Built from the rows as shown (filter and sort), with the months behind them.
    const [view, months] = marketsXlsx.mock.calls[0] ?? [];
    expect(view?.rows.map((r) => r.id)).toEqual(['de', 'es']);
    expect(months).toHaveLength(6);
  });

  describe('in euros (ADR 0017)', () => {
    const ds = datasetSchema.parse(raw);
    const view = (d: typeof ds) => marketsTable(d, {}, '2026-05', '3m', ['de', 'es'], null);
    afterEach(() => {
      localStorage.clear();
    });

    it('Excel: amounts in euros, the currency and its rate on the About sheet', async () => {
      localStorage.setItem('mo:currency', 'EUR');
      const { user } = setup();
      await user.click(await screen.findByRole('button', { name: t.button }));
      expect(
        await screen.findByRole('menuitem', { name: /Excel.*amounts in EUR/ }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('menuitem', { name: /^Excel/ }));
      await waitFor(() => {
        expect(marketsXlsx).toHaveBeenCalled();
      });
      const [shown, , labels, currency] = marketsXlsx.mock.calls[0] ?? [];
      expect(currency).toBe('EUR');
      const de = shown?.rows.find((r) => r.id === 'de');
      const usd = view(ds).rows.find((r) => r.id === 'de');
      expect(de?.revenue.value).toBeCloseTo((usd?.revenue.value ?? 0) * USD_RATES.EUR, 2);
      expect(de?.attainmentPct.value).toBeCloseTo(usd?.attainmentPct.value ?? Number.NaN, 9);
      expect(view(inCurrency(ds, 'EUR')).rows.find((r) => r.id === 'de')).toEqual(de);
      expect(labels?.about).toContainEqual({
        label: t.about.currency,
        value:
          'EUR (Euro), converted from USD at 1 USD = 0.89095 EUR, ECB rate of 5 November 2026. Fixed for this demo; a live app would get rates from the backend API.',
      });
    });

    it('CSV stays raw USD', async () => {
      localStorage.setItem('mo:currency', 'EUR');
      const { user } = setup();
      await user.click(await screen.findByRole('button', { name: t.button }));
      await user.click(await screen.findByRole('menuitem', { name: /^CSV/ }));
      const usd = view(ds).rows.find((r) => r.id === 'de');
      const csv = String(downloadText.mock.calls[0]?.[1]);
      expect(csv).toContain(`de,DE,Germany,Europe,${String(Math.round(usd?.revenue.value ?? 0))},`);
    });
  });

  it('nothing to save: the button is disabled', async () => {
    setup('?mode=analyst&region=apac&markets=de');
    expect(await screen.findByRole('button', { name: t.button })).toBeDisabled();
  });

  it('Excel that cannot be made (ExcelJS not loaded) is logged and told; the menu still works', async () => {
    const failure = new Error('Loading chunk exceljs failed');
    marketsXlsx.mockRejectedValueOnce(failure);
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: t.button }));
    await user.click(await screen.findByRole('menuitem', { name: /^Excel/ }));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(t.failed);
    });
    expect(logError).toHaveBeenCalledWith(failure, { scope: 'ui', action: 'export_xlsx' });
    expect(downloadBlob).not.toHaveBeenCalled();
    // Not stuck busy: a second try goes through.
    const button = screen.getByRole('button', { name: t.button });
    expect(button).not.toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    await user.click(await screen.findByRole('menuitem', { name: /^Excel/ }));
    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledOnce();
    });
  });

  it('CSV the browser refuses to save is logged and told', async () => {
    const failure = new Error('blocked');
    downloadText.mockImplementationOnce(() => {
      throw failure;
    });
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: t.button }));
    await user.click(await screen.findByRole('menuitem', { name: /^CSV/ }));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(t.failed);
    });
    expect(logError).toHaveBeenCalledWith(failure, { scope: 'ui', action: 'export_csv' });
  });

  it('while the workbook is made the button says so and a second click waits', async () => {
    let finish: (blob: Blob) => void = () => {};
    marketsXlsx.mockImplementationOnce(
      () =>
        new Promise<Blob>((resolve) => {
          finish = resolve;
        }),
    );
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: t.button }));
    await user.click(await screen.findByRole('menuitem', { name: /^Excel/ }));
    const busy = await screen.findByRole('button', { name: t.preparing });
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await user.click(busy);
    expect(await screen.findByRole('menuitem', { name: /^Excel/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    finish(new Blob(['x']));
    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledOnce();
    });
    expect(marketsXlsx).toHaveBeenCalledOnce();
  });
});
