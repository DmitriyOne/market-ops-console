import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { renderWithProviders } from '@/shared/lib/test';

import { ModeSwitch } from './ModeSwitch';

const t = en.mode;

describe('ModeSwitch', () => {
  it('Executive is on by default', () => {
    renderWithProviders(<ModeSwitch />);
    expect(screen.getByRole('radiogroup', { name: t.label })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: t.executive })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('switching mode replaces the URL instead of adding a history step', async () => {
    const { user, lastUpdate } = renderWithProviders(<ModeSwitch />, {
      searchParams: '?market=de',
    });
    await user.click(screen.getByRole('radio', { name: t.analyst }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?market=de&mode=analyst');
    });
    expect(lastUpdate()?.options.history).toBe('replace');
  });

  it('back to Executive removes the param', async () => {
    const { user, lastUpdate } = renderWithProviders(<ModeSwitch />, {
      searchParams: '?mode=analyst',
    });
    await user.click(screen.getByRole('radio', { name: t.executive }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('');
    });
  });

  it('pressing the active mode again keeps it', async () => {
    const { user, onUrlUpdate } = renderWithProviders(<ModeSwitch />, {
      searchParams: '?mode=analyst',
    });
    await user.click(screen.getByRole('radio', { name: t.analyst }));
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });
});
