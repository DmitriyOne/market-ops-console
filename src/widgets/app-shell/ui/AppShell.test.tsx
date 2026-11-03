import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';

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
  const ui = (
    <NextIntlClientProvider locale="en-GB" messages={en}>
      <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
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
  const view = render(ui);
  return { ...view, ui, api, onUrlUpdate, user: userEvent.setup() };
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

  it('desktop: collapsing the panel persists across remounts', async () => {
    viewport(true);
    const { user, unmount, ui } = setup();
    await user.click(screen.getByRole('button', { name: t.collapse }));
    expect(document.documentElement).toHaveAttribute('data-assistant-collapsed');
    unmount();
    render(ui);
    expect(document.documentElement).toHaveAttribute('data-assistant-collapsed');
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
});
