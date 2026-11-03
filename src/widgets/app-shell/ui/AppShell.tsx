'use client';

import { PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { SectionTabBar, useSection } from '@/features/switch-section';
import { cn, useMediaQuery } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { usePanelCollapsed } from '../model/use-panel-collapsed';

export type AssistantApi = {
  /** An answer finished; badges it when the assistant is not visible. */
  notifyAnswer: () => void;
  /** Phones: switch to the dashboard. Desktop: nothing, both are visible. */
  showMain: () => void;
  /** The desktop collapse button, for the assistant's header row. */
  headerAction: ReactNode;
};

type AppShellProps = {
  header: ReactNode;
  main: ReactNode;
  assistant: (api: AssistantApi) => ReactNode;
};

// Tailwind `lg`. Layout is CSS; this is only for behaviour.
const DESKTOP = '(min-width: 64rem)';

/**
 * Desktop: dashboard with the assistant as a right panel that collapses to
 * a rail. Phone: one section at a time with a bottom tab bar. The assistant
 * is mounted once, so the conversation survives switching.
 */
export function AppShell({ header, main, assistant }: AppShellProps) {
  const t = useTranslations('shell');
  const tCommon = useTranslations('common');
  const desktop = useMediaQuery(DESKTOP);
  const [section, setSection] = useSection();
  const [collapsed, setCollapsed] = usePanelCollapsed();
  const [unread, setUnread] = useState(0);

  const hidden = desktop ? collapsed : section !== 'assistant';

  const notifyAnswer = useCallback(() => {
    if (hidden) setUnread((n) => n + 1);
  }, [hidden]);
  const showMain = useCallback(() => {
    if (!desktop) setSection('overview');
  }, [desktop, setSection]);
  const headerAction = useMemo(
    () => (
      <Button
        type="button"
        variant="ghost"
        className="hidden size-11 lg:inline-flex"
        aria-label={t('collapse')}
        onClick={() => {
          setCollapsed(true);
        }}
      >
        <PanelRightCloseIcon aria-hidden />
      </Button>
    ),
    [t, setCollapsed],
  );
  const api = useMemo(
    () => ({ notifyAnswer, showMain, headerAction }),
    [notifyAnswer, showMain, headerAction],
  );

  const expand = () => {
    setCollapsed(false);
    setUnread(0);
  };
  const changeSection = (s: typeof section) => {
    setSection(s);
    if (s === 'assistant') setUnread(0);
  };
  const badge = unread > 0 ? t('newAnswers', { count: unread }) : null;

  return (
    <div className="flex h-dvh flex-col bg-background">
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {tCommon('skipToContent')}
      </a>
      <header className="border-b border-border">{header}</header>
      <div className="flex min-h-0 flex-1">
        <main
          id="main"
          className={cn(
            'min-w-0 flex-1 overflow-y-auto',
            section === 'assistant' && 'max-lg:hidden',
          )}
        >
          {main}
        </main>
        <aside
          aria-label={t('assistant')}
          className={cn(
            'flex min-h-0 flex-col border-border max-lg:flex-1 lg:border-l',
            collapsed ? 'lg:w-14' : 'lg:w-96',
            section !== 'assistant' && 'max-lg:hidden',
          )}
        >
          {collapsed ? (
            <div className="hidden flex-col items-center gap-2 p-2 lg:flex">
              <Button
                type="button"
                variant="ghost"
                className="relative size-11"
                aria-label={badge ? `${t('expand')} · ${badge}` : t('expand')}
                onClick={expand}
              >
                <PanelRightOpenIcon aria-hidden />
                {badge ? (
                  <span
                    aria-hidden
                    className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-surface-ai-label"
                  />
                ) : null}
              </Button>
            </div>
          ) : null}
          <div className={cn('min-h-0 flex-1', collapsed && 'lg:hidden')}>{assistant(api)}</div>
        </aside>
      </div>
      <div className="lg:hidden">
        <SectionTabBar section={section} onChange={changeSection} badge={unread} />
      </div>
    </div>
  );
}
