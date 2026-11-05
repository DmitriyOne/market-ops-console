import { screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { SelectionChips } from './SelectionChips';

const remove = (name: string) => en.marketFilter.remove.replace('{name}', name);

function setup(searchParams: string, onEmptied = vi.fn()) {
  const view = renderWithProviders(
    <Suspense>
      <SelectionChips onEmptied={onEmptied} />
    </Suspense>,
    { searchParams },
  );
  return { ...view, onEmptied };
}

describe('SelectionChips', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('removing a chip moves focus to the one now in its place, or the one before', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&markets=de&markets=es&markets=fr');
    await user.click(await screen.findByRole('button', { name: remove('Spain') }));
    expect(lastUpdate()?.queryString).toBe('?mode=analyst&markets=de&markets=fr');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: remove('France') })).toHaveFocus();
    });
    await user.click(screen.getByRole('button', { name: remove('France') }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: remove('Germany') })).toHaveFocus();
    });
  });

  it('the last chip removed hands focus on', async () => {
    const { user, onEmptied } = setup('?mode=analyst&markets=de');
    await user.click(await screen.findByRole('button', { name: remove('Germany') }));
    await waitFor(() => {
      expect(onEmptied).toHaveBeenCalledOnce();
    });
    expect(screen.queryByRole('list')).toBeNull();
  });
});
