'use client';

import { CheckIcon, Share2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { cn, logEvent } from '@/shared/lib';
import { Button, Skeleton, toast } from '@/shared/ui';

const COPIED_MS = 2000;

/**
 * Share link: copies the page's address. The URL holds the whole view (drill
 * path, period, mode, selection, currency, open tab) and the language prefix, so a
 * colleague opening it sees the same screen. An icon on phones, an icon with
 * its name from `sm` up.
 */
export function ShareLinkButton({ className }: { className?: string }) {
  const t = useTranslations('shareLink');
  // 0 = idle; each copy gets a new number, so a repeat click is read out again.
  const [copied, setCopied] = useState(0);
  // One timer: a second click restarts the 2 s instead of being cut short by the first.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const onCopy = async () => {
    const url = new URL(window.location.href);
    // An in-page anchor (the skip link's `#main`) is not part of the view.
    url.hash = '';
    try {
      await navigator.clipboard.writeText(url.href);
    } catch {
      // Clipboard blocked (permissions, insecure context): say so, nothing to report.
      toast.error(t('failed'));
      return;
    }
    logEvent('link_copied', { params: [...new Set(url.searchParams.keys())] });
    setCopied((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(0);
    }, COPIED_MS);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn('size-11 sm:size-auto sm:min-h-11 sm:px-3', className)}
        onClick={() => {
          void onCopy();
        }}
      >
        {copied ? <CheckIcon aria-hidden /> : <Share2Icon aria-hidden />}
        <span className="sr-only sm:not-sr-only">{t('button')}</span>
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? <span key={copied}>{t('copied')}</span> : null}
      </span>
    </>
  );
}

/** As wide as the button in the page's language (its label, hidden), so the title row does not move. */
export function ShareLinkButtonSkeleton() {
  const t = useTranslations('shareLink');
  return (
    <Skeleton
      aria-hidden
      className="flex size-11 shrink-0 items-center justify-center gap-1.5 border border-transparent text-sm font-medium sm:size-auto sm:h-11 sm:px-3"
    >
      <Share2Icon className="invisible size-4" />
      <span className="invisible hidden sm:inline">{t('button')}</span>
    </Skeleton>
  );
}
