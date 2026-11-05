import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { alertsApi, datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { DashboardHeader } from './DashboardHeader';

vi.mock('@wrksz/themes/client', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}));
vi.mock('@/shared/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/config')>()),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

const t = en.drill;

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <DashboardHeader />
    </Suspense>,
    { searchParams },
  );
}

const params = (update: ReturnType<ReturnType<typeof setup>['lastUpdate']>) =>
  Object.fromEntries(update?.searchParams ?? []);

describe('DashboardHeader', () => {
  beforeEach(() => {
    server.use(datasetHandler(), ...alertsApi().handlers);
  });

  it('the bell counts the markets the rules flag and opens the alerts (tab=alerts)', async () => {
    const { user, lastUpdate } = setup();
    const bell = await screen.findByRole('button', { name: 'Alerts, 5 markets flagged' });
    expect(bell).toHaveTextContent('5');
    await user.click(bell);
    await waitFor(() => {
      expect(params(lastUpdate())).toEqual({ tab: 'alerts' });
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });

  it('on the portfolio the path is "Portfolio" and a region chooser; no market or product yet', async () => {
    setup();
    const nav = await screen.findByRole('navigation', { name: t.label });
    expect(within(nav).getByText(t.portfolio)).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: t.chooseRegion })).toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: t.chooseMarket })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: t.chooseProduct })).not.toBeInTheDocument();
  });

  it('choosing a region drills into it', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await screen.findByRole('button', { name: t.chooseRegion }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Europe' }));
    await waitFor(() => {
      expect(params(lastUpdate())).toEqual({ region: 'eu' });
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });

  it('the product step appears only under a market and lists the products', async () => {
    const { user, lastUpdate } = setup('?region=eu&market=de');
    const nav = await screen.findByRole('navigation', { name: t.label });
    expect(
      within(nav).getByRole('button', { name: 'Market: Germany. Change market' }),
    ).toHaveAttribute('aria-current', 'page');
    await user.click(within(nav).getByRole('button', { name: t.chooseProduct }));
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(5);
    await user.click(screen.getByRole('menuitemradio', { name: 'Veltrix' }));
    await waitFor(() => {
      expect(params(lastUpdate())).toEqual({ region: 'eu', market: 'de', product: 'veltrix' });
    });
  });

  it('the market list holds only the markets of the region', async () => {
    const { user } = setup('?region=apac');
    await user.click(await screen.findByRole('button', { name: t.chooseMarket }));
    expect(screen.getAllByRole('menuitemradio').map((i) => i.textContent)).toEqual([
      'Japan',
      'China',
      'India',
      'Australia',
    ]);
  });

  it('picking the current market again goes back up from the product', async () => {
    const { user, lastUpdate } = setup('?region=eu&market=de&product=veltrix');
    await user.click(await screen.findByRole('button', { name: 'Market: Germany. Change market' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Germany' }));
    await waitFor(() => {
      expect(params(lastUpdate())).toEqual({ region: 'eu', market: 'de' });
    });
  });

  it('picking another market keeps the product', async () => {
    const { user, lastUpdate } = setup('?region=eu&market=de&product=veltrix');
    await user.click(await screen.findByRole('button', { name: 'Market: Germany. Change market' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'France' }));
    await waitFor(() => {
      expect(params(lastUpdate())).toEqual({ region: 'eu', market: 'fr', product: 'veltrix' });
    });
  });

  it('Portfolio is a link back up when deeper', async () => {
    const { user, lastUpdate } = setup('?region=eu&period=2026-02');
    await user.click(await screen.findByRole('button', { name: t.portfolio }));
    await waitFor(() => {
      expect(params(lastUpdate())).toEqual({ period: '2026-02' });
    });
  });

  it('phone settings open as a sheet with language and theme and close with Esc', async () => {
    const { user } = setup();
    const settings = await screen.findByRole('button', { name: en.header.settings });
    await user.click(settings);
    const sheet = screen.getByRole('dialog', { name: en.header.settingsTitle });
    // Whole rows are the targets, and they say the current choice.
    expect(
      within(sheet).getByRole('button', { name: `${en.theme.label} ${en.theme.light}` }),
    ).toBeInTheDocument();
    const language = within(sheet).getByRole('button', {
      name: `${en.locale.label} ${en.locale['en-GB']}`,
    });
    await user.click(language);
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(4);
    await user.keyboard('{Escape}');
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(settings).toHaveFocus();
  });

  it('the app name leads to the clean dashboard and resets the view', async () => {
    const { user, lastUpdate } = setup('?region=eu&market=de&period=2026-03&mode=analyst');
    const home = screen.getByRole('link', { name: `${en.common.appName}, ${en.header.resetView}` });
    expect(home).toHaveAttribute('href', expect.stringMatching(/\/dashboard$/));
    await user.click(home);
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('');
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });
});
