'use client';

import { useQuery } from '@tanstack/react-query';
import { SparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import {
  datasetQueryOptions,
  type ResolvedCitation,
  useDashboardFocus,
} from '@/entities/performance';
import { Composer, SuggestedQuestions, useChatStream } from '@/features/ask-question';

import { AnswerMessage } from './AnswerMessage';
import { Conversation } from './Conversation';

type AssistantPanelProps = {
  /** An answer finished (the shell shows a badge when the panel is hidden). */
  onAnswerDone?: () => void;
  /** A source was opened on the dashboard (the phone shell switches to it). */
  onFocusDashboard?: () => void;
};

export function AssistantPanel({ onAnswerDone, onFocusDashboard }: AssistantPanelProps) {
  const t = useTranslations('assistant.panel');
  const chat = useChatStream();
  // Not suspense: the chat works even if the dataset fails to load.
  const { data: ds } = useQuery(datasetQueryOptions);
  const { focus, highlight } = useDashboardFocus();

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

  return (
    <section aria-label={t('title')} className="flex h-full min-h-0 flex-col bg-card">
      {chat.messages.length === 0 ? (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <SparklesIcon aria-hidden className="size-7 text-surface-ai-label" />
          <h2 className="text-lg font-semibold">{t('empty.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('empty.body')}</p>
          <SuggestedQuestions onAsk={chat.ask} />
          <p className="text-xs text-muted-foreground">{t('empty.englishNote')}</p>
        </div>
      ) : (
        <Conversation
          messages={chat.messages}
          renderAnswer={(message) => (
            <AnswerMessage
              message={message}
              ds={ds}
              onAsk={chat.ask}
              onRetry={chat.retry}
              onSource={onSource}
              onHighlight={onHighlight}
            />
          )}
        />
      )}
      <div className="border-t border-border p-3">
        <Composer isStreaming={chat.isStreaming} onAsk={chat.ask} onStop={chat.stop} />
      </div>
    </section>
  );
}
