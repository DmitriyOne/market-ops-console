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
