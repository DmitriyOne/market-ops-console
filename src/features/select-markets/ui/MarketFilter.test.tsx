import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { MarketFilter } from './MarketFilter';

const t = en.marketFilter;

function setup(searchParams = '?mode=analyst') {
  return renderWithProviders(
    <Suspense>
      <MarketFilter />
    </Suspense>,
    { searchParams },
  );
}

describe('MarketFilter', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('lists the markets of the scope by region; checking two keeps the menu open', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&region=eu');
    await user.click(await screen.findByRole('button', { name: t.button }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitemcheckbox')).toHaveLength(5);
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Germany' }));
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Spain' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Spain' })).toBeChecked();
    expect(lastUpdate()?.queryString).toBe('?mode=analyst&region=eu&markets=de&markets=es');
  });

  it('chips name the selection; × removes one; Clear removes all and focuses the menu button', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&markets=de&markets=es');
    const remove = await screen.findByRole('button', { name: 'Remove Germany' });
    expect(screen.getByRole('button', { name: 'Remove Spain' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${t.button} (2)` })).toBeInTheDocument();
    await user.click(remove);
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&markets=es');
    });
    await user.click(screen.getByRole('button', { name: t.clear }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst');
    });
    expect(screen.getByRole('button', { name: t.button })).toHaveFocus();
  });

  it('no selection: no chips and no Clear', async () => {
    setup();
    await screen.findByRole('button', { name: t.button });
    expect(screen.queryByRole('button', { name: t.clear })).not.toBeInTheDocument();
  });
});
