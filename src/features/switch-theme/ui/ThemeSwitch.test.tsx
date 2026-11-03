import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';

import { ThemeSwitch } from './ThemeSwitch';

const setTheme = vi.fn();
// What useTheme returns; `theme`/`resolvedTheme` are undefined before hydration.
type ThemeState = { theme?: string; resolvedTheme?: string; forcedTheme?: string };
const themeState: { current: ThemeState } = vi.hoisted(() => ({ current: {} }));
vi.mock('@wrksz/themes/client', () => ({
  useTheme: () => ({ ...themeState.current, setTheme }),
}));

function renderSwitch() {
  render(
    <NextIntlClientProvider locale="en-GB" messages={en}>
      <ThemeSwitch />
    </NextIntlClientProvider>,
  );
}

describe('ThemeSwitch', () => {
  beforeEach(() => {
    themeState.current = { theme: 'system', resolvedTheme: 'light' };
  });

  it('offers light, dark and system and applies the choice', async () => {
    renderSwitch();

    await userEvent.click(screen.getByRole('button', { name: en.theme.label }));
    const items = screen.getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual([
      en.theme.light,
      en.theme.dark,
      en.theme.system,
    ]);

    await userEvent.click(screen.getByRole('menuitemradio', { name: en.theme.dark }));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('stays disabled until the theme is known after hydration', () => {
    themeState.current = {};
    renderSwitch();
    expect(screen.getByRole('button', { name: en.theme.label })).toBeDisabled();
  });

  it('is disabled while a theme is forced', () => {
    themeState.current = { theme: 'dark', resolvedTheme: 'dark', forcedTheme: 'dark' };
    renderSwitch();
    expect(screen.getByRole('button', { name: en.theme.label })).toBeDisabled();
  });
});
