'use client';

import { BellIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useFlaggedCount } from '@/features/configure-alerts';
import { useSection } from '@/features/switch-section';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

/** The header's bell: opens the alerts sheet (`tab=alerts`), counts flagged markets. */
export function AlertsButton({ className }: { className?: string }) {
  const t = useTranslations('alerts');
  const count = useFlaggedCount();
  const [, setSection] = useSection();
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn('relative size-11', className)}
      aria-label={t('button', { count: count ?? 0 })}
      onClick={() => {
        setSection('alerts');
      }}
    >
      <BellIcon aria-hidden />
      {count ? (
        <span
          aria-hidden
          className="absolute top-1 right-0.5 min-w-4 rounded-full bg-foreground px-1 text-center text-xs leading-4 font-semibold text-background tabular-nums"
        >
          {count}
        </span>
      ) : null}
    </Button>
  );
}
