import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en, formats } from '@/shared/config';
import { Toaster } from '@/shared/ui';

import { ShareLinkButton } from './ShareLinkButton';

vi.mock('@wrksz/themes/client', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}));

const t = en.shareLink;
const writeText = vi.fn<(text: string) => Promise<void>>();

function setup() {
  render(
    <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
      <ShareLinkButton />
      <Toaster />
    </NextIntlClientProvider>,
  );
  return screen.getByRole('button', { name: t.button });
}

async function click(button: HTMLElement) {
  await act(async () => {
    fireEvent.click(button);
    await Promise.resolve();
  });
}

describe('ShareLinkButton', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    window.history.replaceState(null, '', '/dashboard?region=eu&market=de&mode=analyst');
  });
  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('copies the whole address, view state included, and says so', async () => {
    const button = setup();
    await click(button);
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/dashboard?region=eu&market=de&mode=analyst`,
    );
    expect(screen.getByText(t.copied)).toBeInTheDocument();
    // The name stays "Share link": it is still the same action.
    expect(button).toHaveAccessibleName(t.button);
  });

  it('a second click keeps "Link copied" for a full 2 s from that click', async () => {
    vi.useFakeTimers();
    const button = setup();
    await click(button);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    await click(button);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(t.copied)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText(t.copied)).not.toBeInTheDocument();
  });

  it('a blocked clipboard shows where to copy it from instead', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    await click(setup());
    expect(await screen.findByText(t.failed)).toBeInTheDocument();
    expect(screen.queryByText(t.copied)).not.toBeInTheDocument();
  });
});
