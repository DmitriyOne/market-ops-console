import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { alertsApi, datasetHandler, server } from '@/shared/lib/test';

import { applyPanelCollapsed } from '../model/panel-collapsed-script';
import { AppShell, type AssistantApi } from './AppShell';

const t = en.shell;
const scrollTo = vi.fn();

function viewport(desktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('min-width') ? desktop : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function setup(searchParams = '') {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const api: { current: AssistantApi | null } = { current: null };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const withUrl = (search: string) => (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en-GB" messages={en}>
        <NuqsTestingAdapter searchParams={search} onUrlUpdate={onUrlUpdate} hasMemory>
          <AppShell
            header={<span>Header</span>}
            main={<p>Main content</p>}
            alerts={<p>Alerts content</p>}
            assistant={(a) => {
              api.current = a;
              return (
                <div>
                  {a.headerAction}
                  <p>Assistant content</p>
                </div>
              );
            }}
          />
        </NuqsTestingAdapter>
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
  const ui = withUrl(searchParams);
  const view = render(ui);
  return { ...view, ui, withUrl, api, onUrlUpdate, user: userEvent.setup() };
}

const assistantPane = () => screen.getByRole('complementary', { name: t.assistant });

describe('AppShell', () => {
  beforeEach(() => {
    // jsdom has no Element#scrollTo; showMain calls it.
    scrollTo.mockClear();
    Element.prototype.scrollTo = scrollTo;
    localStorage.clear();
    server.use(datasetHandler(), ...alertsApi().handlers);
    document.documentElement.removeAttribute('data-assistant-collapsed');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('phone: scrolling down hides the period row; back on Overview it shows again', async () => {
    viewport(false);
    const { user, container } = setup();
    const header = container.querySelector('header');
    const main = screen.getByRole('main');
    const scrollMain = (top: number) => {
      act(() => {
        main.scrollTop = top;
        main.dispatchEvent(new Event('scroll'));
      });
    };
    scrollMain(400);
    expect(header).toHaveAttribute('data-controls-hidden');
    scrollMain(300);
    expect(header).not.toHaveAttribute('data-controls-hidden');
    scrollMain(600);
    expect(header).toHaveAttribute('data-controls-hidden');

    await user.click(screen.getByRole('button', { name: /^Assistant/ }));
    await user.click(screen.getByRole('button', { name: 'Overview' }));
    expect(header).not.toHaveAttribute('data-controls-hidden');
  });

  it('phone: the dashboard scrolls a focused control to below the period row', () => {
    viewport(false);
    setup();
    expect(screen.getByRole('main')).toHaveClass('max-lg:scroll-pt-controls');
  });

  it('has a skip link to the main content', () => {
    viewport(true);
    setup();
    expect(screen.getByRole('link', { name: en.common.skipToContent })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('desktop: a collapse is remembered for the next page load', async () => {
    viewport(true);
    const { user, unmount, ui } = setup();
    await user.click(screen.getByRole('button', { name: t.collapse }));
    unmount();
    // A reload starts from a fresh <html>; only localStorage carries the choice.
    document.documentElement.removeAttribute('data-assistant-collapsed');
    applyPanelCollapsed();
    expect(document.documentElement).toHaveAttribute('data-assistant-collapsed');
    render(ui);
    expect(screen.getByRole('button', { name: t.expand })).toBeInTheDocument();
  });

  it('desktop: keyboard focus follows collapse and expand', async () => {
    viewport(true);
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: t.collapse }));
    expect(screen.getByRole('button', { name: t.expand })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: t.expand }));
    expect(screen.getByRole('button', { name: t.collapse })).toHaveFocus();
  });

  it('desktop: a collapse in another tab applies here too', () => {
    viewport(true);
    setup();
    localStorage.setItem('mo:assistant-collapsed', '1');
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'mo:assistant-collapsed', newValue: '1' }),
      );
    });
    expect(document.documentElement).toHaveAttribute('data-assistant-collapsed');
  });

  it('desktop: when storage is full the panel still collapses and badges answers', async () => {
    viewport(true);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { user, api } = setup();
    await user.click(screen.getByRole('button', { name: t.collapse }));
    act(() => {
      api.current?.notifyAnswer();
    });
    expect(
      await screen.findByRole('button', { name: `${t.expand} · 1 new answer` }),
    ).toBeInTheDocument();
  });

  it('desktop: a broken localStorage leaves the panel open without crashing', () => {
    viewport(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    setup();
    expect(document.documentElement).not.toHaveAttribute('data-assistant-collapsed');
    expect(screen.getByText('Assistant content')).toBeInTheDocument();
  });

  it('desktop: an answer while collapsed shows a badge; expanding clears it', async () => {
    viewport(true);
    const { user, api } = setup();
    await user.click(screen.getByRole('button', { name: t.collapse }));
    act(() => {
      api.current?.notifyAnswer();
    });
    const expand = await screen.findByRole('button', { name: `${t.expand} · 1 new answer` });
    await user.click(expand);
    act(() => {
      api.current?.notifyAnswer();
    });
    expect(screen.queryByText('1 new answer')).not.toBeInTheDocument();
  });

  it('phone: tab=assistant shows the assistant and marks its tab', () => {
    viewport(false);
    setup('?tab=assistant');
    const tabs = screen.getByRole('navigation', { name: t.sections });
    expect(tabs).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.tabs.assistant })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(assistantPane()).not.toHaveClass('max-lg:hidden');
    expect(screen.getByRole('main')).toHaveClass('max-lg:hidden');
  });

  it('phone: showMain switches to the overview', async () => {
    viewport(false);
    const { api, onUrlUpdate } = setup('?tab=assistant');
    act(() => {
      api.current?.showMain();
    });
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get('tab')).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('main')).not.toHaveClass('max-lg:hidden');
    });
  });

  it('desktop: showMain scrolls the dashboard to the top', () => {
    viewport(true);
    const { api } = setup();
    act(() => {
      api.current?.showMain();
    });
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });

  it('phone: showMain scrolls the dashboard to the top once it is shown', async () => {
    viewport(false);
    const { api } = setup('?tab=assistant');
    act(() => {
      api.current?.showMain();
    });
    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    });
  });

  it('desktop: showMain leaves the URL alone', () => {
    viewport(true);
    const { api, onUrlUpdate } = setup();
    act(() => {
      api.current?.showMain();
    });
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });

  it('phone: an answer while on the overview badges the Assistant tab', async () => {
    viewport(false);
    const { api, user } = setup();
    act(() => {
      api.current?.notifyAnswer();
    });
    expect(await screen.findByText('1 new answer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: new RegExp(t.tabs.assistant) }));
    await waitFor(() => {
      expect(screen.queryByText('1 new answer')).not.toBeInTheDocument();
    });
  });

  it('phone: coming back to the assistant with Back clears the badge', async () => {
    viewport(false);
    const { api, rerender, withUrl } = setup('?tab=overview');
    act(() => {
      api.current?.notifyAnswer();
    });
    expect(await screen.findByText('1 new answer')).toBeInTheDocument();
    // Back/forward changes the URL without a tab-bar click.
    rerender(withUrl('?tab=assistant'));
    await waitFor(() => {
      expect(screen.queryByText('1 new answer')).not.toBeInTheDocument();
    });
  });

  it('a crash in the assistant keeps the dashboard, and the reverse', () => {
    viewport(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Boom = (): never => {
      throw new Error('render failed');
    };
    const client = new QueryClient();
    const frame = (ui: ReactNode) => (
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en-GB" messages={en}>
          <NuqsTestingAdapter>{ui}</NuqsTestingAdapter>
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
    const first = render(
      frame(
        <AppShell
          header={null}
          main={<p>Main content</p>}
          assistant={() => <Boom />}
          alerts={null}
        />,
      ),
    );
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(within(assistantPane()).getByText(en.errors.sectionTitle)).toBeInTheDocument();
    first.unmount();
    render(
      frame(
        <AppShell
          header={null}
          main={<Boom />}
          assistant={() => <p>Assistant content</p>}
          alerts={null}
        />,
      ),
    );
    expect(screen.getByText('Assistant content')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText(en.errors.sectionTitle)).toBeInTheDocument();
  });

  it('phone: the Alerts tab shows the panel full screen with the flagged count', async () => {
    viewport(false);
    const { user } = setup();
    const tab = screen.getByRole('button', { name: /^Alerts/ });
    await waitFor(() => {
      expect(tab).toHaveAccessibleName('Alerts, 5 markets flagged');
    });
    await user.click(tab);
    expect(await screen.findByRole('heading', { level: 1, name: t.alerts })).toBeInTheDocument();
    expect(screen.getByText('Alerts content')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveClass('max-lg:hidden');
    expect(screen.getByRole('main')).toHaveClass('max-lg:hidden');
  });

  it('desktop: a link to tab=alerts opens the sheet; Escape closes it with a replace', async () => {
    viewport(true);
    const { user, onUrlUpdate } = setup('?tab=alerts');
    const dialog = await screen.findByRole('dialog', { name: t.alerts });
    expect(within(dialog).getByText('Alerts content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: t.alerts })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    const event = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(event?.queryString).toBe('');
    expect(event?.options.history).toBe('replace');
  });

  it('desktop: a sheet opened in the app closes with Back, leaving no entry behind', async () => {
    viewport(true);
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { user, rerender, withUrl, onUrlUpdate } = setup('');
    // The bell pushes `tab=alerts`.
    rerender(withUrl('?tab=alerts'));
    await screen.findByRole('dialog', { name: t.alerts });
    const updates = onUrlUpdate.mock.calls.length;
    await user.keyboard('{Escape}');
    expect(back).toHaveBeenCalledTimes(1);
    expect(onUrlUpdate.mock.calls).toHaveLength(updates);
  });

  it('Back while the sheet is open closes it', async () => {
    viewport(true);
    const { rerender, withUrl } = setup('?tab=alerts');
    await screen.findByRole('dialog', { name: t.alerts });
    rerender(withUrl(''));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
