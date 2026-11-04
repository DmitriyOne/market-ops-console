'use client';

import { LayoutDashboardIcon, SparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib';

import { type Section, SECTIONS } from '../model/use-section';

const ICONS = { overview: LayoutDashboardIcon, assistant: SparklesIcon } as const;

type SectionTabBarProps = {
  section: Section;
  onChange: (s: Section) => void;
  /** Unread answers, shown on the Assistant tab. */
  badge?: number;
};

/** Bottom tab bar for phones: labels always shown, 44px targets. */
export function SectionTabBar({ section, onChange, badge = 0 }: SectionTabBarProps) {
  const t = useTranslations('shell');
  return (
    <nav aria-label={t('sections')} className="border-t border-border bg-card">
      <ul className="grid grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = ICONS[s];
          const active = s === section;
          return (
            <li key={s}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
                onClick={() => {
                  onChange(s);
                }}
              >
                <span className="relative">
                  <Icon aria-hidden className="size-5" />
                  {s === 'assistant' && badge > 0 ? (
                    <span
                      aria-hidden
                      className="absolute -top-1 -right-2 size-2.5 rounded-full bg-surface-ai-label"
                    />
                  ) : null}
                </span>
                {t(`tabs.${s}`)}
                {s === 'assistant' && badge > 0 ? (
                  <span className="sr-only">{t('newAnswers', { count: badge })}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
