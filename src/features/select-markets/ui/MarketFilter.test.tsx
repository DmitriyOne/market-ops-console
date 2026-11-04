import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { MarketFilter } from './MarketFilter';
import { SelectionChips } from './SelectionChips';

const t = en.marketFilter;

function setup(searchParams = '?mode=analyst') {
  return renderWithProviders(
    <Suspense>
      <MarketFilter />
      <SelectionChips />
    </Suspense>,
    { searchParams },
  );
}

async function openMenu(user: ReturnType<typeof setup>['user']) {
  await user.click(await screen.findByRole('button', { name: new RegExp(`^${t.button}`) }));
  return screen.findByRole('menu');
}

describe('MarketFilter', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('lists the markets of the scope by region; checking two keeps the menu open', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&region=eu');
    const menu = await openMenu(user);
    expect(within(menu).getAllByRole('menuitemcheckbox', { name: /^(?!All )/ })).toHaveLength(5);
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Germany' }));
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Spain' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Spain' })).toBeChecked();
    expect(lastUpdate()?.queryString).toBe('?mode=analyst&region=eu&markets=de&markets=es');
  });

  it('a region line selects all its markets, then none; part of them shows as mixed', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&markets=fr');
    const menu = await openMenu(user);
    const europe = within(menu).getByRole('menuitemcheckbox', { name: 'All of Europe' });
    expect(europe).toHaveAttribute('aria-checked', 'mixed');
    // A dash for part of the region, not the tick a full region gets.
    expect(europe.querySelector('.lucide-minus')).not.toBeNull();
    expect(europe.querySelector('.lucide-check')).toBeNull();
    await user.click(europe);
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe(
        '?mode=analyst&markets=fr&markets=de&markets=it&markets=es&markets=gb',
      );
    });
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'All of Europe' }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst');
    });
  });

  it('"At risk or off track" selects them (latest month); off the latest month it is disabled', async () => {
    const { user, lastUpdate, unmount } = setup();
    await user.click(within(await openMenu(user)).getByRole('menuitem', { name: t.atRisk }));
    await waitFor(() => {
      expect(new URLSearchParams(lastUpdate()?.queryString).getAll('markets').sort()).toEqual([
        'br',
        'de',
        'es',
        'fr',
        'gb',
        'it',
      ]);
    });
    unmount();
    const again = setup('?mode=analyst&range=3m');
    const menu = await openMenu(again.user);
    expect(within(menu).getByRole('menuitem', { name: new RegExp(t.atRisk) })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('counts the selected markets of the scope; "Clear all" sits in the menu', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&region=eu&markets=de&markets=jp');
    expect(await screen.findByText('1 of 5 selected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.clear })).not.toBeInTheDocument();
    await user.click(within(await openMenu(user)).getByRole('menuitem', { name: t.clearAll }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&region=eu');
    });
  });

  it('chips name the selection; × removes one', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&markets=de&markets=es');
    await user.click(await screen.findByRole('button', { name: 'Remove Germany' }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&markets=es');
    });
  });

  it('nothing selected: no count, "Clear all" disabled', async () => {
    const { user } = setup();
    const menu = await openMenu(user);
    expect(within(menu).getByRole('menuitem', { name: t.clearAll })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
  });
});
