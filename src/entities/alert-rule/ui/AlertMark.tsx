import { BellIcon, BellRingIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/shared/lib';

import type { MarketFlag } from '../model/evaluate';

const STYLE = {
  warning: { Icon: BellIcon, className: 'text-status-at-risk' },
  critical: { Icon: BellRingIcon, className: 'text-status-off-track' },
} as const;

/** The flag's rule names: "Flagged (critical): Attainment below 95%, Share below 10%". */
export function useFlagLabel(): (flag: MarketFlag) => string {
  const t = useTranslations('alerts');
  const format = useFormatter();
  return (flag) =>
    t('flagged', {
      severity: flag.severity,
      rules: format.list(
        flag.rules.map((r) => r.name),
        { type: 'conjunction' },
      ),
    });
}

/**
 * A bell for a flagged market: a ringing bell for critical, a plain one for
 * warning, so severity is not colour only. The rule names are its text.
 */
export function AlertMark({
  flag,
  className,
  labelled = true,
}: {
  flag: MarketFlag;
  className?: string;
  /** False when the surrounding text already names the rules. */
  labelled?: boolean;
}) {
  const label = useFlagLabel();
  const { Icon, className: tone } = STYLE[flag.severity];
  return (
    <>
      <Icon aria-hidden className={cn('size-3.5 shrink-0', tone, className)} />
      {labelled ? <span className="sr-only">{label(flag)}</span> : null}
    </>
  );
}
