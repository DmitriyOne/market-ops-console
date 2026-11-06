import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import raw from '@/data/data.json';
import { datasetSchema } from '@/shared/api';
import { enMessages as en } from '@/shared/config';
import {
  alertsApi,
  datasetHandler,
  renderWithProviders,
  server,
  TestProviders,
} from '@/shared/lib/test';

import { MarketStatus } from './MarketStatus';

const t = en.marketStatus;

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <MarketStatus />
    </Suspense>,
    { searchParams },
  );
}

describe('MarketStatus', () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(datasetHandler(), ...alertsApi([]).handlers);
  });

  it('the map table has an Alerts column naming the rules that flag each market', async () => {
    server.use(...alertsApi().handlers);
    const { user } = setup();
    await user.click(await screen.findByRole('radio', { name: 'Table' }));
    const table = screen.getByRole('table', { name: 'Market status by region, May 2026' });
    expect(within(table).getByRole('columnheader', { name: t.alerts })).toBeInTheDocument();
    const germany = within(table).getByRole('row', { name: /Germany/ });
    await waitFor(() => {
      expect(germany).toHaveTextContent('Critical alert: Attainment below 95% and Share below 10%');
    });
    expect(within(table).getByRole('row', { name: /Spain/ })).toHaveTextContent(t.noAlerts);
  });

  it('one tile per market, named with status and attainment', async () => {
    setup();
    const section = await screen.findByRole('region', { name: t.title });
    expect(within(section).getAllByRole('button', { name: /attainment/ })).toHaveLength(13);
    expect(
      within(section).getByRole('button', { name: 'DE 92.0% attainment, Germany, Off track' }),
    ).toBeInTheDocument();
  });

  it('legend counts each status by shape and word', async () => {
    setup();
    const section = await screen.findByRole('region', { name: t.title });
    expect(
      within(section)
        .getByText(/On track/)
        .closest('li'),
    ).toHaveTextContent('7');
    expect(
      within(section)
        .getByText(/^At risk/)
        .closest('li'),
    ).toHaveTextContent('4');
    expect(
      within(section)
        .getByText(/^Off track/)
        .closest('li'),
    ).toHaveTextContent('2');
  });

  it('clicking a tile drills into that market', async () => {
    const { user, lastUpdate } = setup('?period=2026-05');
    await user.click(await screen.findByRole('button', { name: /^DE .*, Germany/ }));
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toMatchObject({
        region: 'eu',
        market: 'de',
      });
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });

  it('markets listed by the assistant are marked in the name, not by colour alone', async () => {
    setup('?markets=es&markets=fr');
    expect(
      await screen.findByRole('button', {
        name: 'ES 104.5% attainment, Spain, Off track · selected',
      }),
    ).toBeInTheDocument();
  });

  it('off the latest month: no status anywhere, a notice instead', async () => {
    setup('?period=2026-03');
    expect(await screen.findByText(t.latestOnly)).toBeInTheDocument();
    expect(screen.queryByText(/Off track|At risk|On track/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^DE [\d.]+% attainment, Germany$/ }),
    ).toBeInTheDocument();
  });

  it('with a product chosen, values are for that product and status per market', async () => {
    setup('?region=eu&market=de&product=veltrix');
    expect(
      await screen.findByText('Values are for Veltrix; status is set per market.'),
    ).toBeInTheDocument();
  });

  it('the table caption names the window, not just a month', async () => {
    const { user } = setup('?period=2026-03&range=3m');
    await user.click(await screen.findByRole('radio', { name: 'Table' }));
    expect(
      screen.getByRole('table', { name: 'Market status by region, Mar 2026 · 3 months' }),
    ).toBeInTheDocument();
  });

  it('a region shows only its markets', async () => {
    setup('?region=apac');
    const section = await screen.findByRole('region', { name: t.title });
    expect(within(section).getAllByRole('button', { name: /attainment/ })).toHaveLength(4);
  });

  it('the table gives the same facts as the tiles', async () => {
    const { user } = setup();
    await user.click(await screen.findByRole('radio', { name: 'Table' }));
    const table = screen.getByRole('table', { name: 'Market status by region, May 2026' });
    const germany = within(table).getByRole('row', { name: /Germany/ });
    expect(germany).toHaveTextContent('Europe');
    expect(germany).toHaveTextContent('92.0%');
    expect(germany).toHaveTextContent('Off track');
    expect(within(table).getAllByRole('row')).toHaveLength(14);
    expect(screen.getByRole('radio', { name: 'Table' })).toBeChecked();
    expect(screen.queryByRole('button', { name: /^DE .*, Germany/ })).not.toBeInTheDocument();
  });

  it('the chosen view is remembered', async () => {
    const first = setup();
    await first.user.click(await screen.findByRole('radio', { name: 'Table' }));
    first.unmount();
    const { user } = setup();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Tiles' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('a table chosen before the map existed still opens as a table', async () => {
    localStorage.setItem('mo:market-status-table', '1');
    setup();
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('the table follows the map metric in Analyst', async () => {
    localStorage.setItem('mo:market-status-view', 'table');
    setup('?mode=analyst&kpi=growth');
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Growth YoY' })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: /Germany/ })).toHaveTextContent('-9.7%');
  });
});

describe('MarketStatus on the server', () => {
  it('static HTML has the card skeleton: the stored view is unknown until the browser is read', () => {
    const client = new QueryClient();
    client.setQueryData(['dataset', 'v1'], datasetSchema.parse(raw));
    const html = renderToString(
      <TestProviders client={client}>
        <MarketStatus />
      </TestProviders>,
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain(t.title);
    expect(html).not.toContain('World map');
    expect(html).not.toContain('Germany');
  });
});

describe('MarketStatus map', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mo:market-status-view', 'map');
    server.use(datasetHandler(), ...alertsApi([]).handlers);
  });

  const mapGroup = () => screen.findByRole('group', { name: /^World map of markets/ });
  /**
   * Focus as a keyboard user gets it, by Tab: the map rings and explains a
   * market on keyboard focus only (`:focus-visible`), which a bare `focus()`
   * after an earlier test's click is not.
   */
  const focusByKeyboard = async (user: ReturnType<typeof setup>['user'], el: HTMLElement) => {
    for (let i = 0; i < 300 && document.activeElement !== el; i++) await user.tab();
    expect(el).toHaveFocus();
  };

  it('the map tooltip names the rules that flag the market', async () => {
    server.use(...alertsApi().handlers);
    const { user } = setup();
    const us = await within(await mapGroup()).findByRole('button', { name: /^United States,/ });
    await focusByKeyboard(user, us);
    const tip = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(tip).toHaveTextContent('Alert: Share below 10%');
    });
  });

  it('markets are buttons in Tab order (regions, then names), named with value and status', async () => {
    setup();
    const map = await mapGroup();
    const names = (await within(map).findAllByRole('button')).map((b) =>
      b.getAttribute('aria-label'),
    );
    expect(names.map((n) => n?.split(',')[0])).toEqual([
      'Canada',
      'United States',
      'France',
      'Germany',
      'Italy',
      'Spain',
      'United Kingdom',
      'Australia',
      'China',
      'India',
      'Japan',
      'Brazil',
      'Mexico',
    ]);
    expect(names).toContain('Germany, Attainment 92.0%, Off track');
  });

  it('countries without a market are plain land, not focusable', async () => {
    setup();
    const map = await mapGroup();
    await within(map).findAllByRole('button');
    const paths = map.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(150);
    expect(map.querySelectorAll('path[tabindex]')).toHaveLength(13);
  });

  it('Enter on a market drills into it', async () => {
    const { user, lastUpdate } = setup();
    const germany = await within(await mapGroup()).findByRole('button', { name: /^Germany,/ });
    await focusByKeyboard(user, germany);
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toEqual({
        region: 'eu',
        market: 'de',
      });
    });
    expect(lastUpdate()?.options.history).toBe('push');
  });

  it('a mouse click drills in', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await within(await mapGroup()).findByRole('button', { name: /^Spain,/ }));
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toMatchObject({ market: 'es' });
    });
  });

  it('a touch tap opens the tooltip; its button drills in', async () => {
    const { user, lastUpdate } = setup();
    const spain = await within(await mapGroup()).findByRole('button', { name: /^Spain,/ });
    fireEvent.pointerDown(spain, { pointerType: 'touch' });
    fireEvent.pointerUp(spain, { pointerType: 'touch' });
    fireEvent.click(spain);
    expect(lastUpdate()).toBeUndefined();
    await user.click(await screen.findByRole('button', { name: 'Open Spain' }));
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toMatchObject({ market: 'es' });
    });
  });

  const tap = (el: Element) => {
    fireEvent.pointerDown(el, { pointerType: 'touch' });
    fireEvent.pointerUp(el, { pointerType: 'touch' });
    fireEvent.click(el);
  };

  it('a tap on another market moves the tooltip there in one tap', async () => {
    setup();
    const map = await mapGroup();
    tap(await within(map).findByRole('button', { name: /^Spain,/ }));
    await screen.findByRole('button', { name: 'Open Spain' });
    const italy = within(map).getByRole('button', { name: /^Italy,/ });
    fireEvent.pointerDown(italy, { pointerType: 'touch' });
    fireEvent.pointerUp(italy, { pointerType: 'touch' });
    fireEvent.click(italy);
    expect(await screen.findByRole('button', { name: 'Open Italy' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Spain' })).not.toBeInTheDocument();
  });

  it('the tap tooltip closes when the page scrolls', async () => {
    setup();
    tap(await within(await mapGroup()).findByRole('button', { name: /^Spain,/ }));
    await screen.findByRole('button', { name: 'Open Spain' });
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Open Spain' })).not.toBeInTheDocument();
    });
  });

  it('Executive ignores kpi in the URL and colours by status', async () => {
    setup('?kpi=growth');
    const legend = await screen.findByRole('list', { name: t.legend });
    expect(legend).toHaveTextContent('On track');
    expect(
      await within(await mapGroup()).findByRole('button', {
        name: 'Germany, Attainment 92.0%, Off track',
      }),
    ).toBeInTheDocument();
  });

  it('keyboard focus shows the tooltip; Esc hides it', async () => {
    const { user } = setup();
    const germany = await within(await mapGroup()).findByRole('button', { name: /^Germany,/ });
    await focusByKeyboard(user, germany);
    const tip = await screen.findByRole('dialog');
    expect(tip).toHaveTextContent('Germany');
    expect(tip).toHaveTextContent('92.0%');
    expect(within(tip).queryByRole('button')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('a past month colours by attainment and says why', async () => {
    setup('?period=2026-03');
    expect(await screen.findByText(t.notice.statusLatestOnly)).toBeInTheDocument();
    const names = (await within(await mapGroup()).findAllByRole('button')).map((b) =>
      b.getAttribute('aria-label'),
    );
    expect(names.some((n) => /track|risk/i.test(n ?? ''))).toBe(false);
    expect(screen.getByRole('list', { name: t.legend }).children).toHaveLength(5);
  });

  it('Executive has no metric picker; Analyst picks one without a history entry', async () => {
    const first = setup('?kpi=growth');
    await mapGroup();
    expect(screen.queryByRole('button', { name: /^Map colour/ })).not.toBeInTheDocument();
    first.unmount();
    const { user, lastUpdate } = setup('?mode=analyst');
    await user.click(await screen.findByRole('button', { name: 'Map colour: Status. Change' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Growth YoY' }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&kpi=growth');
    });
    expect(lastUpdate()?.options.history).toBe('replace');
  });

  it('growth has six legend steps with counts that add up to 13', async () => {
    setup('?mode=analyst&kpi=growth');
    const legend = await screen.findByRole('list', { name: t.legend });
    const items = within(legend).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      'below -5.0%1',
      '-5.0% – -1.0%1',
      '-1.0% – +1.0%1',
      '+1.0% – +5.0%3',
      '+5.0% – +10.0%3',
      '+10.0% and above4',
    ]);
  });

  it('revenue steps read in the compact currency format', async () => {
    setup('?mode=analyst&kpi=revenue');
    const legend = await screen.findByRole('list', { name: t.legend });
    const items = within(legend)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items[0]).toMatch(/^below \$1m\d+$/);
    expect(items[1]).toMatch(/^\$1m – \$1\.5m\d+$/);
  });

  describe('in euros (ADR 0017)', () => {
    afterEach(() => {
      localStorage.clear();
    });

    it('revenue steps stay round in the chosen currency; markets fall by their euro revenue', async () => {
      setup('?mode=analyst&kpi=revenue');
      const usd = within(await screen.findByRole('list', { name: t.legend }))
        .getAllByRole('listitem')
        .map((li) => li.textContent);
      // Under $1M in May 2026: Australia, Italy, Mexico, Spain.
      expect(usd[0]).toBe('below $1m4');
    });

    it('Brazil (1,115,100 $ = 993,498 €) drops under €1M', async () => {
      localStorage.setItem('mo:currency', 'EUR');
      setup('?mode=analyst&kpi=revenue');
      const items = within(await screen.findByRole('list', { name: t.legend }))
        .getAllByRole('listitem')
        .map((li) => li.textContent);
      expect(items[0]).toBe('below €1m5');
      expect(items[1]).toMatch(/^€1m – €1\.5m\d+$/);
    });
  });

  it('Open in the tap tooltip brings the page back to its top', async () => {
    const main = document.createElement('main');
    main.id = 'main';
    const scrollTo = vi.fn();
    main.scrollTo = scrollTo;
    document.body.append(main);
    const { user } = setup();
    const spain = await within(await mapGroup()).findByRole('button', { name: /^Spain,/ });
    fireEvent.pointerDown(spain, { pointerType: 'touch' });
    fireEvent.pointerUp(spain, { pointerType: 'touch' });
    fireEvent.click(spain);
    await user.click(await screen.findByRole('button', { name: 'Open Spain' }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    main.remove();
  });

  it('markets from the assistant zoom the map in', async () => {
    setup('?markets=es&markets=fr');
    const map = await mapGroup();
    await waitFor(() => {
      const transform = map.querySelector('.rsm-zoomable-group')?.getAttribute('transform') ?? '';
      expect(Number(/scale\(([\d.]+)\)/.exec(transform)?.[1])).toBeGreaterThan(1.5);
    });
  });

  it('a reload with a selection never shows the whole world first (no jump to it)', async () => {
    // Every DOM state the browser could paint: is the map visible, and at what zoom?
    const seen: number[] = [];
    const observer = new MutationObserver(() => {
      const svg = document.querySelector('svg.rsm-svg');
      if (!svg || svg.classList.contains('invisible')) return;
      const transform = svg.querySelector('.rsm-zoomable-group')?.getAttribute('transform') ?? '';
      seen.push(Number(/scale\(([\d.]+)\)/.exec(transform)?.[1] ?? 1));
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
    setup('?markets=cn');
    await mapGroup();
    await waitFor(() => {
      expect(seen.length).toBeGreaterThan(0);
    });
    observer.disconnect();
    expect(Math.min(...seen)).toBeGreaterThan(1.5);
  });

  const zoomOf = (map: HTMLElement) =>
    Number(
      /scale\(([\d.]+)\)/.exec(
        map.querySelector('.rsm-zoomable-group')?.getAttribute('transform') ?? '',
      )?.[1] ?? 1,
    );

  it('Analyst: Shift+click adds a market to the selection, without a drill or a flight', async () => {
    const { user, lastUpdate } = setup('?mode=analyst');
    const map = await mapGroup();
    const germany = await within(map).findByRole('button', { name: /^Germany,/ });
    await user.keyboard('{Shift>}');
    await user.click(germany);
    await user.keyboard('{/Shift}');
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&markets=de');
    });
    expect(lastUpdate()?.options.history).toBe('push');
    expect(
      await within(map).findByRole('button', { name: /^Germany,.*· selected$/ }),
    ).toBeInTheDocument();
    // A flight would have started within a few frames.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(zoomOf(map)).toBe(1);
    expect(screen.getByText(t.hintPointer)).toBeInTheDocument();
  });

  it('Analyst: Shift+Enter toggles the focused market', async () => {
    const { user, lastUpdate } = setup('?mode=analyst&markets=es');
    const spain = await within(await mapGroup()).findByRole('button', { name: /^Spain,/ });
    spain.focus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst');
    });
  });

  it('a market outside the drilled region drills as usual, even with Shift', async () => {
    const { lastUpdate } = setup('?mode=analyst&region=eu');
    const japan = await within(await mapGroup()).findByRole('button', { name: /^Japan,/ });
    // The region drill zooms in, where d3-zoom handles mousedown; jsdom gives it no view.
    fireEvent.click(japan, { shiftKey: true });
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toMatchObject({ market: 'jp' });
    });
  });

  it('Analyst touch tooltip adds to and removes from the filter', async () => {
    const { user, lastUpdate } = setup('?mode=analyst');
    tap(await within(await mapGroup()).findByRole('button', { name: /^Italy,/ }));
    await user.click(await screen.findByRole('button', { name: t.addToFilter }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&markets=it');
    });
    tap(within(await mapGroup()).getByRole('button', { name: /^Italy,/ }));
    await user.click(await screen.findByRole('button', { name: t.removeFromFilter }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst');
    });
  });

  it('Executive: no hint, no filter button, Shift+click drills', async () => {
    const { user, lastUpdate } = setup();
    const map = await mapGroup();
    expect(screen.queryByText(t.hintPointer)).not.toBeInTheDocument();
    tap(await within(map).findByRole('button', { name: /^Italy,/ }));
    await screen.findByRole('button', { name: 'Open Italy' });
    expect(screen.queryByRole('button', { name: t.addToFilter })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.keyboard('{Shift>}');
    await user.click(within(map).getByRole('button', { name: /^Spain,/ }));
    await user.keyboard('{/Shift}');
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toMatchObject({ market: 'es' });
    });
  });
});

describe('MarketStatus tiles selection', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mo:market-status-view', 'tiles');
    server.use(datasetHandler());
  });

  it('Analyst: Shift+click on a tile toggles it', async () => {
    const { user, lastUpdate } = setup('?mode=analyst');
    await user.keyboard('{Shift>}');
    await user.click(await screen.findByRole('button', { name: /^FR .*, France/ }));
    await user.keyboard('{/Shift}');
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?mode=analyst&markets=fr');
    });
    expect(
      await screen.findByRole('button', { name: /^FR .*, France.*· selected$/ }),
    ).toBeInTheDocument();
  });

  it('a selection shows as a bar with chips in Executive too; Clear empties it', async () => {
    const { user, lastUpdate } = setup('?markets=fr&markets=es');
    const bar = await screen.findByRole('group', { name: en.marketFilter.selected });
    expect(within(bar).getByRole('button', { name: 'Remove France' })).toBeInTheDocument();
    await user.click(within(bar).getByRole('button', { name: en.marketFilter.clear }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('');
    });
    expect(screen.getByRole('heading', { name: t.title })).toHaveFocus();
  });
});
