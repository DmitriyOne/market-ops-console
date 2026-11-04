import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import rawData from '@/data/data.json';
import { datasetSchema } from '@/shared/api';
import { enMessages as en, formats } from '@/shared/config';

import { SourceButton } from './SourceButton';

const ds = datasetSchema.parse(rawData);
const t = en.assistant.evidence;

function touchDevice() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(pointer: coarse)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe('SourceButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('touch: "Show on dashboard" focuses the dashboard and closes the card', async () => {
    touchDevice();
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
        <SourceButton
          citation={{ marketId: 'de', period: ds.meta.latestPeriod, label: 'Germany' }}
          ds={ds}
          onSelect={onSelect}
        />
      </NextIntlClientProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Germany' }));
    await user.click(await screen.findByRole('button', { name: t.showOnDashboard }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ known: true }));
    // On a phone the panel is hidden next; an open card would float over the dashboard.
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: t.showOnDashboard })).not.toBeInTheDocument();
    });
  });
});
