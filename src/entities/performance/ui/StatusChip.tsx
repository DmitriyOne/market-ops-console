import { CircleIcon, SquareIcon, TriangleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { MarketStatus } from '@/shared/api';
import { cn } from '@/shared/lib';

const STYLE = {
  on_track: {
    Icon: CircleIcon,
    key: 'onTrack',
    className: 'bg-status-on-track-muted text-status-on-track',
  },
  at_risk: {
    Icon: TriangleIcon,
    key: 'atRisk',
    className: 'bg-status-at-risk-muted text-status-at-risk',
  },
  off_track: {
    Icon: SquareIcon,
    key: 'offTrack',
    className: 'bg-status-off-track-muted text-status-off-track',
  },
} as const;

/** The status shape alone (● ▲ ■), for places that also say the word. */
export function StatusIcon({ status, className }: { status: MarketStatus; className?: string }) {
  const { Icon } = STYLE[status];
  return <Icon aria-hidden className={cn('size-2.5 fill-current', className)} />;
}

/** The translated status word. */
export function useStatusLabel(): (status: MarketStatus) => string {
  const t = useTranslations('dataCheck');
  return (status) => t(STYLE[status].key);
}

/** Status as shape + word + colour, never colour alone. */
export function StatusChip({ status }: { status: MarketStatus }) {
  const t = useTranslations('dataCheck');
  const { Icon, key, className } = STYLE[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        className,
      )}
    >
      <Icon aria-hidden className="size-2.5 fill-current" />
      {t(key)}
    </span>
  );
}
