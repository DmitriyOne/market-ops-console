'use client';

import { ArrowUpIcon, SquareIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type KeyboardEvent, type SubmitEvent, useId, useState } from 'react';

import { CHAT_QUESTION_MAX_LENGTH } from '@/shared/api';
import { Button, Textarea } from '@/shared/ui';

const COUNTER_FROM = 450;
// A letter outside A–Z: Cyrillic, umlauts, accents. German without umlauts
// is not caught; accepted (owner decision, 2026-11-03).
const NON_ENGLISH_LETTER = /(?![A-Za-z])\p{L}/u;

type ComposerProps = {
  isStreaming: boolean;
  onAsk: (question: string) => void;
  onStop: () => void;
};

export function Composer({ isStreaming, onAsk, onStop }: ComposerProps) {
  const t = useTranslations('assistant.composer');
  const [value, setValue] = useState('');
  const reasonId = useId();

  const question = value.trim();
  const tooLong = question.length > CHAT_QUESTION_MAX_LENGTH;
  const canSend = !isStreaming && question.length > 0 && !tooLong;
  const reason =
    question.length === 0
      ? t('blankReason')
      : tooLong
        ? t('tooLongReason', { max: CHAT_QUESTION_MAX_LENGTH })
        : null;

  const nonEnglish = NON_ENGLISH_LETTER.test(value);

  const send = () => {
    if (!canSend) return;
    onAsk(question);
    setValue('');
  };

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape' && isStreaming) {
      event.preventDefault();
      onStop();
    } else if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <label htmlFor={`${reasonId}-field`} className="sr-only">
        {t('label')}
      </label>
      <div className="flex items-end gap-2">
        <Textarea
          id={`${reasonId}-field`}
          value={value}
          placeholder={t('placeholder')}
          readOnly={isStreaming}
          aria-disabled={isStreaming}
          aria-invalid={tooLong}
          aria-describedby={
            [nonEnglish ? `${reasonId}-lang` : '', tooLong ? reasonId : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          rows={1}
          className="max-h-40 min-h-11 resize-none text-base md:text-base"
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onKeyDown={onKeyDown}
        />
        {isStreaming ? (
          <Button
            type="button"
            size="icon-lg"
            className="size-11"
            aria-label={t('stop')}
            onClick={onStop}
          >
            <SquareIcon aria-hidden />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon-lg"
            className="size-11"
            aria-label={t('send')}
            aria-describedby={reason ? reasonId : undefined}
            disabled={!canSend}
          >
            <ArrowUpIcon aria-hidden />
          </Button>
        )}
      </div>
      <div className="flex min-h-5 items-start justify-between gap-3 text-xs">
        <p id={`${reasonId}-lang`} aria-live="polite" className="text-muted-foreground">
          {nonEnglish ? t('englishOnly') : null}
        </p>
        {question.length >= COUNTER_FROM ? (
          <span className={tooLong ? 'font-medium text-destructive' : 'text-muted-foreground'}>
            {t('counter', { count: question.length, max: CHAT_QUESTION_MAX_LENGTH })}
          </span>
        ) : null}
      </div>
      <p id={reasonId} className={tooLong ? 'text-xs text-destructive' : 'sr-only'}>
        {reason}
      </p>
    </form>
  );
}
