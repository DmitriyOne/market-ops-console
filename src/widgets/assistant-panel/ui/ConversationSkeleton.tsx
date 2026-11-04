import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib';
import { Skeleton } from '@/shared/ui';

function Exchange({ lines, full = false }: { lines: string[]; full?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Question bubble, right-aligned like the real one. */}
      <Skeleton
        data-skeleton="question"
        className={cn('ml-10 h-9 self-end rounded-xl rounded-br-sm', full ? 'w-3/5' : 'w-2/5')}
      />
      {/* Answer frame: AI label, text, confidence, source buttons. */}
      <div
        data-skeleton="answer"
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
      >
        <Skeleton className="h-3 w-40" />
        {lines.map((width, i) => (
          <Skeleton key={i} className={cn('h-4', width)} />
        ))}
        {full ? (
          <>
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Skeleton className="h-11 w-36 rounded-lg" />
              <Skeleton className="h-11 w-44 rounded-lg" />
              <Skeleton className="h-11 w-28 rounded-lg" />
            </div>
          </>
        ) : null}
      </div>
      {full ? (
        <>
          {/* Copy, helpful, not helpful. */}
          <div className="flex gap-1">
            <Skeleton className="size-11 rounded-lg" />
            <Skeleton className="size-11 rounded-lg" />
            <Skeleton className="size-11 rounded-lg" />
          </div>
          {/* "What the data shows", closed. */}
          <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * The conversation while the stored chat is read, in the shape of the real
 * one (two exchanges: bubble, answer frame, actions, data block), so nothing
 * jumps when it arrives.
 */
export function ConversationSkeleton() {
  const t = useTranslations('assistant.panel');
  return (
    <div aria-busy="true" className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
      <span className="sr-only">{t('loading')}</span>
      <Exchange full lines={['w-full', 'w-11/12', 'w-full', 'w-3/4']} />
      <Exchange lines={['w-full', 'w-2/3']} />
    </div>
  );
}
