import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { enMessages as en, formats } from '@/shared/config';

import { MonthPicker } from './month-picker';

// Like the dataset: Jun 2024 … May 2026.
const PERIODS = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(Date.UTC(2024, 5 + i, 1));
  return `${String(d.getUTCFullYear())}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
});

function setup(value = '2026-05') {
  const onChange = vi.fn();
  render(
    <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
      <MonthPicker value={value} periods={PERIODS} onChange={onChange} />
    </NextIntlClientProvider>,
  );
  return { onChange, user: userEvent.setup() };
}

describe('MonthPicker', () => {
  it('opens on the year of the value with that month selected', () => {
    setup('2026-03');
    expect(screen.getByRole('group', { name: 'Months of 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mar 2026' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('months without data cannot be picked', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Jun 2026' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next year' })).toBeDisabled();
  });

  it('switches year and picks a month', async () => {
    const { onChange, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Previous year' }));
    await user.click(screen.getByRole('button', { name: 'Oct 2025' }));
    expect(onChange).toHaveBeenCalledWith('2025-10');
  });

  it('the first year stops at the first month with data', async () => {
    const { user } = setup('2024-08');
    expect(screen.getByRole('button', { name: 'May 2024' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Jun 2024' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next year' }));
    expect(screen.getByRole('group', { name: 'Months of 2025' })).toBeInTheDocument();
  });

  it('focus stays on a year button when the pressed one hits the end', async () => {
    const { user } = setup('2025-05');
    await user.click(screen.getByRole('button', { name: 'Previous year' }));
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next year' })).toHaveFocus();
  });

  it('arrow keys move between months that have data', async () => {
    const { user } = setup('2026-05');
    screen.getByRole('button', { name: 'May 2026' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Apr 2026' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Jan 2026' })).toHaveFocus();
    // Nothing with data further right of May 2026: focus stays.
    screen.getByRole('button', { name: 'May 2026' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'May 2026' })).toHaveFocus();
  });
});
