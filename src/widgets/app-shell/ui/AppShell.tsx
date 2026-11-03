'use client';

import { PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

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

const FRAME = 'flex h-dvh flex-col bg-background';
const ASIDE =
  'flex min-h-0 flex-col border-border max-lg:flex-1 lg:w-96 lg:border-l lg:assistant-collapsed:w-14';

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
  // Focus moves to whichever of the two buttons is shown next.
  const collapseRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);

  const hidden = desktop ? collapsed : section !== 'assistant';
  // Seen again, however it happened (expand, tab bar, Back): clear the badge.
  const [wasHidden, setWasHidden] = useState(hidden);
  if (hidden !== wasHidden) {
    setWasHidden(hidden);
    if (!hidden) setUnread(0);
  }

  const notifyAnswer = useCallback(() => {
    if (hidden) setUnread((n) => n + 1);
  }, [hidden]);
  const showMain = useCallback(() => {
    if (!desktop) setSection('overview');
  }, [desktop, setSection]);
  const headerAction = useMemo(
    () => (
      <Button
        ref={collapseRef}
        type="button"
        variant="ghost"
        className="hidden size-11 lg:inline-flex"
        aria-label={t('collapse')}
        onClick={() => {
          setCollapsed(true);
          expandRef.current?.focus();
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
    collapseRef.current?.focus();
  };
  const badge = unread > 0 ? t('newAnswers', { count: unread }) : null;

  return (
    <div className={FRAME}>
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
          className={cn(ASIDE, section !== 'assistant' && 'max-lg:hidden')}
        >
          {/* Rail and panel are both rendered; CSS picks one from the <html>
              attribute, so the remembered state shows from the first paint. */}
          <div className="hidden flex-col items-center gap-2 p-2 lg:assistant-collapsed:flex">
            <Button
              ref={expandRef}
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
          <div className="min-h-0 flex-1 lg:assistant-collapsed:hidden">{assistant(api)}</div>
        </aside>
      </div>
      <div className="lg:hidden">
        <SectionTabBar section={section} onChange={setSection} badge={unread} />
      </div>
    </div>
  );
}

/**
 * The static frame shown before the URL is readable (Suspense fallback):
 * same header, dashboard and an empty panel of the right width, so nothing
 * jumps when the live shell takes over.
 */
export function AppShellFallback({ header, main }: Pick<AppShellProps, 'header' | 'main'>) {
  const t = useTranslations('shell');
  return (
    <div className={FRAME}>
      <header className="border-b border-border">{header}</header>
      <div className="flex min-h-0 flex-1">
        <main id="main" className="min-w-0 flex-1 overflow-y-auto">
          {main}
        </main>
        <aside aria-label={t('assistant')} className={cn(ASIDE, 'max-lg:hidden')} />
      </div>
    </div>
  );
}
