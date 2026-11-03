'use client';

import { ArrowDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useRef } from 'react';

import type { ChatMessage } from '@/features/ask-question';
import { Button } from '@/shared/ui';

import { useStickToBottom } from '../model/use-stick-to-bottom';

type ConversationProps = {
  messages: ChatMessage[];
  renderAnswer: (message: ChatMessage) => ReactNode;
};

/**
 * The message log. A streaming answer is `aria-busy`, so screen readers
 * announce it once, when it is finished, not token by token.
 */
export function Conversation({ messages, renderAnswer }: ConversationProps) {
  const t = useTranslations('assistant.panel');
  const ref = useRef<HTMLDivElement>(null);
  const contentKey = messages.map((m) => `${m.id}:${String(m.text.length)}:${m.status}`).join('|');
  const { showNewContent, scrollToBottom } = useStickToBottom(ref, contentKey);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className="flex h-full flex-col gap-4 overflow-y-auto p-4"
      >
        {messages.map((message) => (
          <article
            key={message.id}
            aria-busy={message.status === 'streaming'}
            className="flex flex-col gap-2"
          >
            <p className="ml-10 self-end rounded-xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              <span className="sr-only">{t('youAsked')}: </span>
              {message.question}
            </p>
            {renderAnswer(message)}
          </article>
        ))}
      </div>
      {showNewContent ? (
        <Button
          type="button"
          variant="outline"
          className="absolute bottom-3 left-1/2 min-h-11 -translate-x-1/2 rounded-full shadow-sm"
          onClick={scrollToBottom}
        >
          <ArrowDownIcon aria-hidden />
          {t('newContent')}
        </Button>
      ) : null}
    </div>
  );
}
