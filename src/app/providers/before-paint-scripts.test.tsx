import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const inserted: (() => ReactNode)[] = [];
// Only the hook is replaced: next-intl's navigation needs the rest.
vi.mock(import('next/navigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  useServerInsertedHTML: (callback: () => ReactNode) => {
    inserted.push(callback);
  },
}));

const { BEFORE_PAINT_SCRIPT, BeforePaintScripts } = await import('./before-paint-scripts');

describe('BeforePaintScripts', () => {
  it('renders nothing in the tree and inserts one script, once', () => {
    const { container } = render(<BeforePaintScripts />);
    expect(container).toBeEmptyDOMElement();
    const insert = inserted.at(-1);
    if (!insert) throw new Error('no inserted HTML');
    const first = render(<>{insert()}</>);
    const script = first.container.querySelector('script');
    expect(script?.innerHTML).toBe(BEFORE_PAINT_SCRIPT);
    // A later flush of the stream adds nothing.
    expect(insert()).toBeNull();
  });

  it('holds all three marks', () => {
    expect(BEFORE_PAINT_SCRIPT).toContain('data-assistant-collapsed');
    expect(BEFORE_PAINT_SCRIPT).toContain('data-section');
    expect(BEFORE_PAINT_SCRIPT).toContain('data-mode');
  });
});
