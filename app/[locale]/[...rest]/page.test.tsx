import { describe, expect, it, vi } from 'vitest';

import CatchAll from './page';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
);
vi.mock('next/navigation', () => ({ notFound }));

// With `as-needed` routing the proxy rewrites an unknown prefix
// (`/xx/dashboard`) to `/en-GB/xx/dashboard`, so this route is what
// turns it into a 404 (ADR 0010).
describe('locale catch-all route', () => {
  it('renders the not-found page for any unknown path', () => {
    expect(() => {
      CatchAll();
    }).toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledOnce();
  });
});
