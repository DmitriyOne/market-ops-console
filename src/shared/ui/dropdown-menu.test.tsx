import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

function Menu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Theme</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Dark</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenuContent: focus after it closes (0.12.0)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a pointer pick puts focus back on the trigger without the focus ring', async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const trigger = screen.getByRole('button', { name: 'Theme' });
    await user.click(trigger);
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    await user.click(screen.getByRole('menuitem', { name: 'Dark' }));
    expect(trigger).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true, focusVisible: false });
  });

  it('Escape keeps Radix’s own return (the keyboard user sees where they are)', async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const trigger = screen.getByRole('button', { name: 'Theme' });
    await user.click(trigger);
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(focus).not.toHaveBeenCalledWith(expect.objectContaining({ focusVisible: false }));
  });
});
