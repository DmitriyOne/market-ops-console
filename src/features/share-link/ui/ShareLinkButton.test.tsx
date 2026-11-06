import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en, formats } from '@/shared/config';
import { Toaster } from '@/shared/ui';

import { ShareLinkButton, ShareLinkButtonSkeleton } from './ShareLinkButton';

vi.mock('@wrksz/themes/client', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}));

const t = en.shareLink;
const writeText = vi.fn<(text: string) => Promise<void>>();

/** jsdom has no clipboard: put one on `navigator` for a test, and take it off after. */
function setClipboard(clipboard: { writeText: typeof writeText } | undefined) {
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
}

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
    setClipboard({ writeText });
    window.history.replaceState(null, '', '/dashboard?region=eu&market=de&mode=analyst#main');
  });
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'clipboard');
    window.history.replaceState(null, '', '/');
  });

  it('copies the whole address, view state included and the in-page anchor dropped, and says so', async () => {
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

  it('reads "Link copied" out again on a repeat click', async () => {
    const button = setup();
    await click(button);
    const first = screen.getByText(t.copied);
    await click(button);
    // A new node in the live region: screen readers announce it again.
    expect(screen.getByText(t.copied)).not.toBe(first);
  });

  it('a browser without the clipboard API (plain http) gets the same hint', async () => {
    setClipboard(undefined);
    await click(setup());
    // sonner keeps the previous test's toast in its store; one more is enough.
    expect((await screen.findAllByText(t.failed)).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.copied)).not.toBeInTheDocument();
  });

  it('the skeleton holds the label (hidden) so it is as wide as the button', () => {
    render(
      <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
        <ShareLinkButtonSkeleton />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(t.button, { ignore: '' })).toHaveClass('invisible');
  });
});
