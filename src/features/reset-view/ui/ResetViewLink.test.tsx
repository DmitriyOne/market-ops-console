import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/shared/lib/test';

import { ResetViewLink } from './ResetViewLink';

describe('ResetViewLink', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resets the view and scrolls the dashboard back to the top', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    const scrollTo = vi.fn();
    const { user, lastUpdate } = renderWithProviders(
      <>
        <ResetViewLink>Home</ResetViewLink>
        <main
          id="main"
          ref={(el) => {
            if (el) el.scrollTo = scrollTo;
          }}
        />
      </>,
      { searchParams: '?region=eu' },
    );
    await user.click(screen.getByRole('link', { name: 'Home' }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('');
    });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
