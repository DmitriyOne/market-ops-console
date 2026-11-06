'use client';

import { CheckIcon, LinkIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { cn, logEvent } from '@/shared/lib';
import { Button, Skeleton, toast } from '@/shared/ui';

const COPIED_MS = 2000;

/**
 * Copies the page's address: the URL holds the whole view (drill path,
 * period, mode, selection, open tab), so a colleague opening it sees the
 * same screen. The currency and the language are each viewer's own and are
 * not in it. An icon on phones, an icon with its name from `sm` up.
 */
export function CopyLinkButton({ className }: { className?: string }) {
  const t = useTranslations('shareLink');
  const [copied, setCopied] = useState(false);
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
    try {
      await navigator.clipboard.writeText(url.href);
    } catch {
      // Clipboard blocked (permissions, insecure context): say so, nothing to report.
      toast.error(t('failed'));
      return;
    }
    logEvent('link_copied', { params: [...new Set(url.searchParams.keys())] });
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
    }, COPIED_MS);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn('size-11 sm:size-auto sm:min-h-11 sm:gap-1.5 sm:px-3', className)}
        onClick={() => {
          void onCopy();
        }}
      >
        {copied ? <CheckIcon aria-hidden /> : <LinkIcon aria-hidden />}
        <span className="sr-only sm:not-sr-only">{t('button')}</span>
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? t('copied') : null}
      </span>
    </>
  );
}

export function CopyLinkButtonSkeleton() {
  return <Skeleton aria-hidden className="size-11 shrink-0 sm:w-32" />;
}
