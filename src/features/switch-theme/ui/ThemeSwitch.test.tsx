import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';

import { ThemeSwitch } from './ThemeSwitch';

const setTheme = vi.fn();
vi.mock('@wrksz/themes/client', () => ({ useTheme: () => ({ theme: 'system', setTheme }) }));

describe('ThemeSwitch', () => {
  it('offers light, dark and system and applies the choice', async () => {
    render(
      <NextIntlClientProvider locale="en-GB" messages={en}>
        <ThemeSwitch />
      </NextIntlClientProvider>,
    );

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
});
