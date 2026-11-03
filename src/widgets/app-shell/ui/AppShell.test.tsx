import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';

import { applyPanelCollapsed } from '../model/panel-collapsed-script';
import { AppShell, type AssistantApi } from './AppShell';

const t = en.shell;

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
  const withUrl = (search: string) => (
    <NextIntlClientProvider locale="en-GB" messages={en}>
      <NuqsTestingAdapter searchParams={search} onUrlUpdate={onUrlUpdate} hasMemory>
        <AppShell
          header={<span>Header</span>}
          main={<p>Main content</p>}
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
  );
  const ui = withUrl(searchParams);
  const view = render(ui);
  return { ...view, ui, withUrl, api, onUrlUpdate, user: userEvent.setup() };
}

const assistantPane = () => screen.getByRole('complementary', { name: t.assistant });

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-assistant-collapsed');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
    const first = render(
      <NextIntlClientProvider locale="en-GB" messages={en}>
        <NuqsTestingAdapter>
          <AppShell header={null} main={<p>Main content</p>} assistant={() => <Boom />} />
        </NuqsTestingAdapter>
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(within(assistantPane()).getByText(en.errors.sectionTitle)).toBeInTheDocument();
    first.unmount();
    render(
      <NextIntlClientProvider locale="en-GB" messages={en}>
        <NuqsTestingAdapter>
          <AppShell header={null} main={<Boom />} assistant={() => <p>Assistant content</p>} />
        </NuqsTestingAdapter>
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Assistant content')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText(en.errors.sectionTitle)).toBeInTheDocument();
  });
});
