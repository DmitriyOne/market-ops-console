'use client';

import { BellIcon, LayoutDashboardIcon, SparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib';

import { type Section, SECTIONS } from '../model/use-section';

const ICONS = { overview: LayoutDashboardIcon, assistant: SparklesIcon, alerts: BellIcon } as const;

type SectionTabBarProps = {
  section: Section;
  onChange: (s: Section) => void;
  /** Unread answers, shown on the Assistant tab. */
  badge?: number;
  /** Markets flagged by the alert rules, shown on the Alerts tab (null: not known yet). */
  alertsCount?: number | null;
};

/**
 * Bottom tab bar for phones, styled as the header's segmented switches
 * (owner, variant E): the current section is a raised card chip on a muted
 * track. Labels always shown, targets over 44px.
 */
export function SectionTabBar({
  section,
  onChange,
  badge = 0,
  alertsCount = null,
}: SectionTabBarProps) {
  const t = useTranslations('shell');
  return (
    <nav
      aria-label={t('sections')}
      className="bg-background px-2.5 pt-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
    >
      <ul className="flex gap-1 rounded-2xl border border-border bg-muted p-1">
        {SECTIONS.map((s) => {
          const Icon = ICONS[s];
          const active = s === section;
          return (
            <li key={s} className="flex-1">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-13 w-full flex-col items-center justify-center gap-0.5 rounded-xl text-xs transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  active
                    ? 'bg-card font-semibold text-foreground shadow-sm'
                    : 'font-medium text-muted-foreground hover:text-foreground',
                )}
                onClick={() => {
                  onChange(s);
                }}
              >
                <span className="relative flex h-6 w-7 items-center justify-center">
                  <Icon aria-hidden className="size-5" />
                  {s === 'assistant' && badge > 0 ? (
                    <span
                      aria-hidden
                      className="absolute top-0 -right-0.5 size-2.5 rounded-full bg-surface-ai-label ring-2 ring-muted"
                    />
                  ) : null}
                  {s === 'alerts' && alertsCount ? (
                    <span
                      aria-hidden
                      className="absolute -top-1 -right-2 min-w-4 rounded-full bg-foreground px-1 text-center text-xs leading-4 font-semibold text-background tabular-nums ring-2 ring-muted"
                    >
                      {alertsCount}
                    </span>
                  ) : null}
                </span>
                {t(`tabs.${s}`)}
                {s === 'assistant' && badge > 0 ? (
                  <span className="sr-only">{t('newAnswers', { count: badge })}</span>
                ) : null}
                {s === 'alerts' && alertsCount ? (
                  <span className="sr-only">{t('flagged', { count: alertsCount })}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
