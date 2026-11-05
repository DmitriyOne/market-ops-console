import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { PopperBoundary, usePopperBoundary } from './popper-boundary';

function Probe() {
  const props = usePopperBoundary();
  return (
    <output>
      {JSON.stringify({ boundary: Boolean(props.collisionBoundary), hide: props.hideWhenDetached })}
    </output>
  );
}

describe('PopperBoundary', () => {
  it('inside the scroll area popups take it as their boundary and hide once detached', () => {
    const area = document.createElement('main');
    render(
      <PopperBoundary value={area}>
        <Probe />
      </PopperBoundary>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('{"boundary":true,"hide":true}');
  });

  it('outside one (the header) nothing changes', () => {
    render(<Probe />);
    expect(screen.getByRole('status')).toHaveTextContent('{"boundary":false}');
  });

  it('a menu opened inside the area still opens (props reach Radix)', () => {
    render(
      <PopperBoundary value={document.body}>
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PopperBoundary>,
    );
    expect(screen.getByRole('menuitem', { name: 'Item' })).toBeInTheDocument();
  });
});
