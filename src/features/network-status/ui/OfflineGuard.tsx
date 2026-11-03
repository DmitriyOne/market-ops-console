'use client';

import { WifiOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useId, useReducer } from 'react';

import { Button } from '@/shared/ui';

import { useOnlineStatus } from '../model/use-online-status';

/**
 * Covers the app while offline. Children stay mounted underneath (made
 * inert), so chat history, drafts and URL state survive reconnecting.
 */
export function OfflineGuard({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const online = useOnlineStatus();
  // Re-render to read navigator.onLine again when the user asks.
  const [, recheck] = useReducer((n: number) => n + 1, 0);
  const titleId = useId();
  const bodyId = useId();

  return (
    <>
      <div inert={!online}>{children}</div>
      {!online && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 p-6 text-center"
        >
          <WifiOffIcon aria-hidden className="size-10" />
          <h2 id={titleId} className="text-xl font-semibold">
            {t('offline.title')}
          </h2>
          <p id={bodyId} className="max-w-sm text-muted-foreground">
            {t('offline.body')}
          </p>
          {/* An alert dialog moves focus to its action when it appears. */}
          <Button ref={(button) => button?.focus()} onClick={recheck}>
            {t('errors.retry')}
          </Button>
        </div>
      )}
    </>
  );
}
