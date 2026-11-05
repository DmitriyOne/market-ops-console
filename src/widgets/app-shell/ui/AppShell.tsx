'use client';

import { PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useFlaggedCount } from '@/features/configure-alerts';
import { SectionTabBar, useSection } from '@/features/switch-section';
import { cn, scrollMainToTop, useMediaQuery } from '@/shared/lib';
import {
  Button,
  PopperBoundary,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  WidgetBoundary,
} from '@/shared/ui';

import { usePanelCollapsed } from '../model/use-panel-collapsed';

export type AssistantApi = {
  /** An answer finished; badges it when the assistant is not visible. */
  notifyAnswer: () => void;
  /** Bring the dashboard into view at its top (phones also switch to it). */
  showMain: () => void;
  /** The desktop collapse button, for the assistant's header row. */
  headerAction: ReactNode;
};

type AppShellProps = {
  header: ReactNode;
  main: ReactNode;
  assistant: (api: AssistantApi) => ReactNode;
  /** The alerts panel: a right sheet on desktop, the Alerts tab on phones (`tab=alerts`). */
  alerts: ReactNode;
};

const FRAME = 'flex h-dvh flex-col bg-background';
// `relative`: screen-reader-only text inside is placed against the scroll
// area, not the page, so it cannot stretch the page below the tab bar.
const HEADER = 'border-b border-border';
const MAIN = 'relative min-w-0 flex-1 overflow-y-auto';
const ALERTS_SECTION = 'relative min-w-0 flex-1 overflow-y-auto p-4';
const ALERTS_TITLE = 'mb-3 text-lg font-semibold';
const ASIDE =
  'flex min-h-0 flex-col border-border max-lg:flex-1 lg:w-96 lg:border-l lg:assistant-collapsed:w-14';

// Tailwind `lg`. Layout is CSS; this is only for behaviour.
const DESKTOP = '(min-width: 64rem)';

/**
 * Desktop: dashboard with the assistant as a right panel that collapses to
 * a rail. Phone: one section at a time with a bottom tab bar. The assistant
 * is mounted once, so the conversation survives switching.
 */
export function AppShell({ header, main, assistant, alerts }: AppShellProps) {
  const t = useTranslations('shell');
  const tCommon = useTranslations('common');
  const desktop = useMediaQuery(DESKTOP);
  const [section, setSection] = useSection();
  const alertsCount = useFlaggedCount();
  const alertsTitleId = useId();
  // Phones show one section at a time; the header belongs to Overview.
  const overviewHidden = section !== 'overview';
  const [collapsed, setCollapsed] = usePanelCollapsed();
  // State, not a ref: the popups read it, so they re-render once it is attached.
  const [mainArea, setMainArea] = useState<HTMLElement | null>(null);
  const [unread, setUnread] = useState(0);
  // Focus moves to whichever of the two buttons is shown next.
  const collapseRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);

  // The before-paint section mark is for the static page only; the URL rules from here.
  useEffect(() => {
    document.documentElement.removeAttribute('data-section');
  }, []);

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
  // Phones scroll once the dashboard is shown: a hidden area cannot scroll.
  const [scrollRequest, setScrollRequest] = useState(0);
  const showMain = useCallback(() => {
    if (!desktop) setSection('overview');
    setScrollRequest((n) => n + 1);
  }, [desktop, setSection]);
  const mainShown = desktop || section !== 'assistant';
  useEffect(() => {
    if (scrollRequest > 0 && mainShown) scrollMainToTop();
  }, [scrollRequest, mainShown]);
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
      {/* Phone assistant: the whole screen, as a chat app. */}
      <header className={cn(HEADER, overviewHidden && 'max-lg:hidden')}>{header}</header>
      <div className="flex min-h-0 flex-1">
        <main ref={setMainArea} id="main" className={cn(MAIN, overviewHidden && 'max-lg:hidden')}>
          {/* Popups here stay below the header (they are portalled to the body). */}
          <PopperBoundary value={mainArea}>
            {/* Each side fails on its own: a crash in one keeps the other. */}
            <WidgetBoundary>{main}</WidgetBoundary>
          </PopperBoundary>
        </main>
        {section === 'alerts' && !desktop ? (
          <section aria-labelledby={alertsTitleId} className={cn(ALERTS_SECTION, 'lg:hidden')}>
            <h1 id={alertsTitleId} className={ALERTS_TITLE}>
              {t('alerts')}
            </h1>
            <WidgetBoundary>{alerts}</WidgetBoundary>
          </section>
        ) : null}
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
          <div className="min-h-0 flex-1 lg:assistant-collapsed:hidden">
            <WidgetBoundary>{assistant(api)}</WidgetBoundary>
          </div>
        </aside>
      </div>
      <div className="lg:hidden">
        <SectionTabBar
          section={section}
          onChange={setSection}
          badge={unread}
          alertsCount={alertsCount}
        />
      </div>
      {/* Desktop: the same `tab=alerts` opens a sheet over the dashboard;
          closing replaces the entry, so Back does not open it again. */}
      <Sheet
        open={desktop && section === 'alerts'}
        onOpenChange={(open) => {
          if (!open) setSection('overview', { history: 'replace' });
        }}
      >
        <SheetContent aria-describedby={undefined} className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="pr-14">
            <SheetTitle className="text-lg font-semibold">{t('alerts')}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <WidgetBoundary>{alerts}</WidgetBoundary>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * The static frame shown before the URL is readable (Suspense fallback):
 * same header, dashboard and an empty panel of the right width, so nothing
 * jumps when the live shell takes over.
 */
export function AppShellFallback({
  header,
  main,
  assistant,
  alerts,
}: Pick<AppShellProps, 'header' | 'main'> & { assistant?: ReactNode; alerts?: ReactNode }) {
  const t = useTranslations('shell');
  return (
    <div className={FRAME}>
      <header
        className={cn(HEADER, 'max-lg:section-assistant:hidden max-lg:section-alerts:hidden')}
      >
        {header}
      </header>
      <div className="flex min-h-0 flex-1">
        {/* `section-*`: set before paint for `?tab=assistant` / `?tab=alerts` (ADR 0015). */}
        <main
          id="main"
          className={cn(MAIN, 'max-lg:section-assistant:hidden max-lg:section-alerts:hidden')}
        >
          {/* Each side fails on its own: a crash in one keeps the other. */}
          <WidgetBoundary>{main}</WidgetBoundary>
        </main>
        <section className={cn(ALERTS_SECTION, 'hidden max-lg:section-alerts:block')}>
          <h1 className={ALERTS_TITLE}>{t('alerts')}</h1>
          {alerts}
        </section>
        <aside
          aria-label={t('assistant')}
          className={cn(ASIDE, 'max-lg:hidden max-lg:section-assistant:flex')}
        >
          {assistant}
        </aside>
      </div>
    </div>
  );
}
