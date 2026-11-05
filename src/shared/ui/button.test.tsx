import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';
import { Toggle } from './toggle';

// `cn` (the shadcn package, ADR 0002) merges classes by what it knows: a
// size or radius under a name of our own would read as something else and
// drop the variant's class (0.11.1 review). These pin what reaches the DOM.
const classes = (el: HTMLElement) => el.className.split(' ');

describe('Button and Toggle sizes keep their variant classes', () => {
  it('sm: the variant colour stays, the small text replaces text-sm', () => {
    render(<Button size="sm">Open</Button>);
    const c = classes(screen.getByRole('button'));
    expect(c).toContain('text-primary-foreground');
    expect(c).toContain('text-[0.8rem]');
    expect(c).not.toContain('text-sm');
  });

  it("sm with the caller's colour: the small text stays", () => {
    render(
      <Button size="sm" variant="outline" className="text-muted-foreground">
        Open
      </Button>,
    );
    const c = classes(screen.getByRole('button'));
    expect(c).toContain('text-muted-foreground');
    expect(c).toContain('text-[0.8rem]');
  });

  it('xs: its own corner replaces rounded-lg', () => {
    render(<Button size="xs">Open</Button>);
    const c = classes(screen.getByRole('button'));
    expect(c).toContain('rounded-[min(var(--radius-md),10px)]');
    expect(c).not.toContain('rounded-lg');
  });

  it('a secondary hover and the default colour do not collide', () => {
    render(<Button variant="secondary">Open</Button>);
    const c = classes(screen.getByRole('button'));
    expect(c).toContain('bg-secondary');
    expect(c).toContain('interactive:hover:bg-secondary-hover');
  });

  it('Toggle sm: the small text replaces text-sm, the corner rounded-lg', () => {
    render(<Toggle size="sm" aria-label="Bold" />);
    const c = classes(screen.getByRole('button'));
    expect(c).toContain('text-[0.8rem]');
    expect(c).not.toContain('text-sm');
    expect(c).toContain('rounded-md');
    expect(c).not.toContain('rounded-lg');
  });
});
