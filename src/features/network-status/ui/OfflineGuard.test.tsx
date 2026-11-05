import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';

import { OfflineGuard } from './OfflineGuard';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      onClick={() => {
        setCount((c) => c + 1);
      }}
    >
      {`count ${String(count)}`}
    </button>
  );
}

function goOffline() {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
}

function goOnline() {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
}

function renderGuard() {
  render(
    <NextIntlClientProvider locale="en-GB" messages={en}>
      <OfflineGuard>
        <Counter />
      </OfflineGuard>
    </NextIntlClientProvider>,
  );
}

describe('OfflineGuard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('covers the app while offline and keeps its state', async () => {
    renderGuard();
    await userEvent.click(screen.getByRole('button', { name: 'count 0' }));
    await userEvent.click(screen.getByRole('button', { name: 'count 1' }));

    for (let round = 0; round < 3; round++) {
      goOffline();
      expect(screen.getByRole('alertdialog', { name: en.offline.title })).toBeInTheDocument();

      goOnline();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'count 2' })).toBeInTheDocument();
    }
  });

  it('takes focus while offline and gives it back to where it was', async () => {
    renderGuard();
    const counter = screen.getByRole('button', { name: 'count 0' });
    await userEvent.click(counter);
    expect(screen.getByRole('button', { name: 'count 1' })).toHaveFocus();

    goOffline();
    expect(screen.getByRole('button', { name: en.errors.retry })).toHaveFocus();
    goOnline();
    expect(screen.getByRole('button', { name: 'count 1' })).toHaveFocus();
  });

  it('re-checks the connection on retry', async () => {
    renderGuard();
    goOffline();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: en.errors.retry }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
