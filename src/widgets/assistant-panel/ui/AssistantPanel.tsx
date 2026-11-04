'use client';

import { useQuery } from '@tanstack/react-query';
import { SparklesIcon, SquarePenIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef } from 'react';

import {
  datasetQueryOptions,
  type ResolvedCitation,
  useDashboardFocus,
} from '@/entities/performance';
import { Composer, SuggestedQuestions, useChatStream } from '@/features/ask-question';
import { useErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui';

import { AnswerMessage, isCantAnswer } from './AnswerMessage';
import { Conversation } from './Conversation';

type AssistantPanelProps = {
  /** An answer finished (the shell shows a badge when the panel is hidden). */
  onAnswerDone?: () => void;
  /** A source was opened on the dashboard (the phone shell switches to it). */
  onFocusDashboard?: () => void;
  /** A control for the header row, e.g. the shell's collapse button. */
  headerAction?: ReactNode;
};

// From this many "can't answer" replies in a row, offer the suggested questions.
const SUGGEST_AFTER = 2;

export function AssistantPanel({
  onAnswerDone,
  onFocusDashboard,
  headerAction,
}: AssistantPanelProps) {
  const t = useTranslations('assistant.panel');
  const chat = useChatStream();
  // Not suspense: the chat works even if the dataset fails to load.
  const { data: ds, error: dsError } = useQuery(datasetQueryOptions);
  // Logged by the query cache; here it only replaces "Loading data…".
  const dataError = useErrorMessage()(dsError);
  const { focus, highlight } = useDashboardFocus();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const notified = useRef(new Set<string>());
  useEffect(() => {
    for (const m of chat.messages) {
      if (m.status === 'done' && !notified.current.has(m.id)) {
        notified.current.add(m.id);
        onAnswerDone?.();
      }
    }
  }, [chat.messages, onAnswerDone]);

  const onSource = (r: ResolvedCitation) => {
    focus(r);
    onFocusDashboard?.();
  };
  const onHighlight = (ids: string[]) => {
    highlight(ids);
    onFocusDashboard?.();
  };

  const last = chat.messages.at(-1);
  let streak = 0;
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    const m = chat.messages[i];
    if (!m || !isCantAnswer(m)) break;
    streak += 1;
  }

  return (
    <section aria-labelledby="assistant-title" className="flex h-full min-h-0 flex-col bg-card">
      <header className="flex min-h-14 items-center gap-2 border-b border-border px-4">
        <SparklesIcon aria-hidden className="size-4 text-surface-ai-label" />
        <h2 id="assistant-title" className="text-base font-semibold">
          {t('title')}
        </h2>
        <span className="flex-1 text-sm text-muted-foreground">{t('subtitle')}</span>
        <Button
          type="button"
          variant="ghost"
          className="size-11"
          aria-label={t('newChat')}
          disabled={chat.messages.length === 0}
          onClick={() => {
            chat.reset();
            // The button is disabled next; keep keyboard focus in the composer.
            inputRef.current?.focus();
          }}
        >
          <SquarePenIcon aria-hidden />
        </Button>
        {headerAction}
      </header>
      {chat.messages.length === 0 ? (
        <div className="relative flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <h3 className="text-lg font-semibold">{t('empty.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('empty.body')}</p>
          <SuggestedQuestions onAsk={chat.ask} />
        </div>
      ) : (
        <Conversation
          messages={chat.messages}
          renderAnswer={(message) => (
            <AnswerMessage
              message={message}
              ds={ds}
              dataError={dataError}
              onAsk={chat.ask}
              onRetry={chat.retry}
              onSource={onSource}
              onHighlight={onHighlight}
              showSuggestions={message.id === last?.id && streak >= SUGGEST_AFTER}
              busy={chat.isStreaming}
            />
          )}
        />
      )}
      <div className="border-t border-border p-3">
        <Composer
          isStreaming={chat.isStreaming}
          onAsk={chat.ask}
          onStop={chat.stop}
          inputRef={inputRef}
        />
      </div>
    </section>
  );
}
