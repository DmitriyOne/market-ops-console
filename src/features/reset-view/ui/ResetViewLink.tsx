'use client';

import type { MouseEvent, ReactNode } from 'react';

import { Link } from '@/shared/config';

import { useResetView } from '../model/use-reset-view';

/**
 * A link to the clean dashboard. A plain click resets the view in place
 * (one history step); a new-tab click opens the clean URL.
 */
export function ResetViewLink({
  children,
  className,
  onReset,
}: {
  children: ReactNode;
  className?: string;
  /** Called after a reset in place, e.g. to close the sheet it sits in. */
  onReset?: () => void;
}) {
  const reset = useResetView();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    reset();
    onReset?.();
  };
  return (
    <Link href="/dashboard" className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
