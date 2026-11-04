import { useTranslations } from 'next-intl';

import { Skeleton } from '@/shared/ui';

/**
 * The conversation while the stored chat is read: one exchange in the shape
 * of the real one (question bubble on the right, neutral answer frame with
 * label, lines and source buttons), so nothing jumps when it arrives.
 */
export function ConversationSkeleton() {
  const t = useTranslations('assistant.panel');
  return (
    <div aria-busy="true" className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
      <span className="sr-only">{t('loading')}</span>
      <Skeleton
        data-skeleton="question"
        className="ml-10 h-9 w-3/5 self-end rounded-xl rounded-br-sm"
      />
      <div
        data-skeleton="answer"
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
      >
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-11 w-32 rounded-lg" />
          <Skeleton className="h-11 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
