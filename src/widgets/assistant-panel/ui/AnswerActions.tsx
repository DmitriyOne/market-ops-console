'use client';

import { CheckIcon, CopyIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import type { ChatMessage } from '@/features/ask-question';
import { logEvent } from '@/shared/lib';
import { Button, toast } from '@/shared/ui';

const REASONS = ['wrongNumbers', 'offTopic', 'missing', 'other'] as const;
type Reason = (typeof REASONS)[number];
type Rating = 'up' | 'down';

const COPIED_MS = 2000;
// Locked rating: the chosen one stays marked, the other fades.
const RATE = 'size-11 aria-pressed:bg-muted aria-disabled:not-aria-pressed:opacity-50';

type AnswerActionsProps = {
  message: ChatMessage;
  /** The answer as plain text with its sources, built when Copy is pressed. */
  getCopyText: () => string;
};

/** Copy and rate a finished answer. Feedback goes to the event log, never the question. */
export function AnswerActions({ message, getCopyText }: AnswerActionsProps) {
  const t = useTranslations('assistant.actions');
  const reasonsId = useId();
  // The reason buttons disappear once one is picked; focus returns here.
  const downRef = useRef<HTMLButtonElement>(null);
  const [copy, setCopy] = useState<'idle' | 'copied'>('idle');
  // One timer: a second Copy restarts the 2 s instead of being cut short by the first.
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(copiedTimer.current);
    },
    [],
  );
  const [rating, setRating] = useState<Rating | null>(null);
  const [reason, setReason] = useState<Reason | null>(null);
  // One rating per answer (owner, 2026-11-04): locked once it is logged.
  const [sent, setSent] = useState(false);

  const record = (value: Rating, why: Reason | null) => {
    setSent(true);
    toast.success(t('thanks'));
    logEvent('answer_feedback', {
      answerId: message.id,
      rating: value,
      reason: why,
      kind: message.kind,
      confidence: message.confidence,
      citations: message.citations.length,
    });
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCopyText());
      setCopy('copied');
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => {
        setCopy('idle');
      }, COPIED_MS);
    } catch {
      // Clipboard blocked (permissions, insecure context): say so, nothing to log.
      toast.error(t('copyFailed'));
    }
  };

  const rate = (value: Rating) => {
    if (sent) return;
    setRating(value);
    setReason(null);
    if (value === 'up') record('up', null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="size-11"
          aria-label={t('copy')}
          onClick={() => {
            void onCopy();
          }}
        >
          {copy === 'copied' ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={RATE}
          aria-label={t('helpful')}
          aria-disabled={sent}
          aria-pressed={rating === 'up'}
          onClick={() => {
            rate('up');
          }}
        >
          <ThumbsUpIcon aria-hidden />
        </Button>
        <Button
          ref={downRef}
          type="button"
          variant="ghost"
          className={RATE}
          aria-label={t('notHelpful')}
          aria-disabled={sent}
          aria-pressed={rating === 'down'}
          onClick={() => {
            rate('down');
          }}
        >
          <ThumbsDownIcon aria-hidden />
        </Button>
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {copy === 'copied' ? t('copied') : null}
        </span>
      </div>
      {rating === 'down' && reason === null ? (
        <div role="group" aria-labelledby={reasonsId} className="flex flex-col gap-1.5">
          <p id={reasonsId} className="text-xs font-medium text-muted-foreground">
            {t('reasonsTitle')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <Button
                key={r}
                type="button"
                variant="outline"
                className="min-h-11 rounded-full"
                onClick={() => {
                  setReason(r);
                  record('down', r);
                  downRef.current?.focus();
                }}
              >
                {t(`reasons.${r}`)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
