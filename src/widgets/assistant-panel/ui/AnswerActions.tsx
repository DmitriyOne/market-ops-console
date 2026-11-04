'use client';

import { CheckIcon, CopyIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import type { ChatMessage } from '@/features/ask-question';
import { logEvent } from '@/shared/lib';
import { Button } from '@/shared/ui';

const REASONS = ['wrongNumbers', 'offTopic', 'missing', 'other'] as const;
type Reason = (typeof REASONS)[number];
type Rating = 'up' | 'down';

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
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [rating, setRating] = useState<Rating | null>(null);
  const [reason, setReason] = useState<Reason | null>(null);

  const record = (value: Rating, why: Reason | null) => {
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
    } catch {
      // Clipboard blocked (permissions, insecure context): say so, nothing to log.
      setCopy('failed');
    }
  };

  const rate = (value: Rating) => {
    setRating(value);
    setReason(null);
    if (value === 'up') record('up', null);
  };

  const thanks = rating === 'up' || reason !== null;

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
          className="size-11"
          aria-label={t('helpful')}
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
          className="size-11"
          aria-label={t('notHelpful')}
          aria-pressed={rating === 'down'}
          onClick={() => {
            rate('down');
          }}
        >
          <ThumbsDownIcon aria-hidden />
        </Button>
        <span aria-live="polite" className="flex gap-2 text-xs text-muted-foreground">
          {copy === 'copied' ? <span>{t('copied')}</span> : null}
          {copy === 'failed' ? <span>{t('copyFailed')}</span> : null}
          {thanks ? <span>{t('thanks')}</span> : null}
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
