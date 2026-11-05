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

function renderGermany(onSelect = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
      <SourceButton
        citation={{ marketId: 'de', period: ds.meta.latestPeriod, label: 'Germany' }}
        ds={ds}
        onSelect={onSelect}
      />
    </NextIntlClientProvider>,
  );
  return screen.getByRole('button', { name: 'Germany' });
}

/** Longer than the card's 200 ms open delay. */
const pastOpenDelay = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 400);
  });

describe('SourceButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mouse: a click closes the card and it stays closed while the pointer is still on the button', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const button = renderGermany(onSelect);
    await user.hover(button);
    expect(await screen.findByText(t.clickHint)).toBeInTheDocument();

    await user.click(button);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ known: true }));
    // The press focuses the button and the hover timer is still running: neither reopens it.
    await pastOpenDelay();
    expect(screen.queryByText(t.clickHint)).not.toBeInTheDocument();

    // Away and back: the card shows again.
    await user.unhover(button);
    await user.hover(button);
    expect(await screen.findByText(t.clickHint)).toBeInTheDocument();
  });

  it('keyboard: Enter closes the card; it shows again when focus comes back', async () => {
    const user = userEvent.setup();
    const button = renderGermany();
    await user.tab();
    expect(button).toHaveFocus();
    expect(await screen.findByText(t.clickHint)).toBeInTheDocument();

    await user.keyboard('{Enter}');
    await pastOpenDelay();
    expect(screen.queryByText(t.clickHint)).not.toBeInTheDocument();

    await user.tab({ shift: true });
    await user.tab();
    expect(await screen.findByText(t.clickHint)).toBeInTheDocument();
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
