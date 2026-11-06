'use client';

import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';

import {
  AbortedError,
  CHAT_QUESTION_MAX_LENGTH,
  chatEventSchema,
  errorMessageKey,
  ParseError,
  streamSse,
} from '@/shared/api';
import { API_ROUTES } from '@/shared/config';
import { logError, startMonitoredSpan } from '@/shared/lib';

import { type ChatMessage, chatReducer } from './chat-reducer';
import { loadChat, saveChat } from './chat-storage';
import { isEnglish } from './language';

export type ChatStream = {
  messages: ChatMessage[];
  /** False until the stored conversation is read (server HTML and hydration). */
  ready: boolean;
  isStreaming: boolean;
  ask: (question: string) => void;
  stop: () => void;
  retry: (id: string) => void;
  /** Start over: stop any answer and clear the conversation. */
  reset: () => void;
};

type Active = { id: string; controller: AbortController };

/** The assistant reported a failure; `name` is the `code` in the log. */
class ChatServerError extends Error {
  override readonly name = 'ChatServerError';
}

// Not JSON is invalid data too; `undefined` then fails the schema.
function parseJson(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

const subscribeNothing = () => () => undefined;
const isClient = () => true;
const isServer = () => false;

// Changes when a message is added, removed or settles; tokens do not change it.
const storageKey = (messages: ChatMessage[]) => messages.map((m) => `${m.id}:${m.status}`).join();

/** The assistant conversation: one streamed answer at a time (ADR 0003, 0006). */
export function useChatStream(): ChatStream {
  const [messages, dispatch] = useReducer(chatReducer, []);
  // The server (and `next dev` SSR) has no sessionStorage: render "not ready"
  // there and while hydrating, then restore on the first client render after.
  const hydrated = useSyncExternalStore(subscribeNothing, isClient, isServer);
  const [ready, setReady] = useState(false);
  if (hydrated && !ready) {
    setReady(true);
    dispatch({ type: 'restore', messages: loadChat() });
  }
  // A ref, not state: `ask` must see a stream started in the same tick.
  const active = useRef<Active | null>(null);

  const run = useCallback(async (id: string, question: string, controller: AbortController) => {
    // A box, not a `let`: it is set inside onData, which TS flow analysis can't see.
    const stream = { settled: false };
    // How long a user waits: to the first token and to the end (ADR 0019).
    // Never the question text.
    const span = startMonitoredSpan('chat.answer', 'ui.chat');
    const timing: { firstToken: boolean; outcome: 'ok' | 'error' } = {
      firstToken: true,
      outcome: 'ok',
    };
    // `done` or `error` is the last event: free the composer and close the
    // connection now, even if the server keeps it open.
    const settle = () => {
      stream.settled = true;
      if (active.current?.id === id) active.current = null;
      controller.abort();
    };
    try {
      await streamSse(
        API_ROUTES.chat,
        { question },
        {
          signal: controller.signal,
          onData: (data) => {
            const parsed = chatEventSchema.safeParse(parseJson(data));
            if (!parsed.success) throw new ParseError(parsed.error.issues);
            const event = parsed.data;
            if (event.type === 'token') {
              if (timing.firstToken) {
                timing.firstToken = false;
                span.set({ 'chat.first_token_ms': span.elapsed() });
              }
              dispatch({ type: 'token', id, value: event.value });
            } else if (event.type === 'done') {
              const { kind, citations, confidence } = event;
              span.set({
                'chat.kind': kind,
                'chat.confidence': confidence,
                'chat.citations': citations.length,
                'chat.total_ms': span.elapsed(),
              });
              if (kind === 'error') {
                timing.outcome = 'error';
                logError(new ChatServerError('Answer ended with kind error'), {
                  scope: 'chat',
                  event: 'done',
                });
              }
              dispatch({ type: 'done', id, kind, citations, confidence });
              settle();
            } else {
              // The server's text is for the log; the user gets a translated message.
              timing.outcome = 'error';
              logError(new ChatServerError(event.message), { scope: 'chat', event: 'error' });
              dispatch({ type: 'failed', id, error: { key: 'errors.server' } });
              settle();
            }
          },
        },
      );
      // The stream closed without `done` or `error`: the connection dropped.
      if (!stream.settled) {
        timing.outcome = 'error';
        logError(new Error('Chat stream closed without done'), { scope: 'chat' });
        dispatch({ type: 'failed', id, error: { key: 'errors.network' } });
      }
    } catch (error) {
      if (stream.settled) return;
      if (error instanceof AbortedError) {
        span.set({ 'chat.stopped': true });
        dispatch({ type: 'stopped', id });
      } else {
        timing.outcome = 'error';
        logError(error, { scope: 'chat' });
        dispatch({ type: 'failed', id, error: { key: errorMessageKey(error) } });
      }
    } finally {
      span.end(timing.outcome);
      if (active.current?.id === id) active.current = null;
    }
  }, []);

  const start = useCallback(
    (raw: string, replaces?: string) => {
      const question = raw.trim();
      if (active.current || !question || question.length > CHAT_QUESTION_MAX_LENGTH) return;
      const id = crypto.randomUUID();
      if (!isEnglish(question)) {
        // The mock assistant matches English keywords only (owner decision, 2026-11-03).
        dispatch({ type: 'declined', id, question, notice: 'englishOnly' });
        return;
      }
      const controller = new AbortController();
      active.current = { id, controller };
      dispatch({ type: 'started', id, question, replaces });
      void run(id, question, controller);
    },
    [run],
  );

  const ask = useCallback(
    (raw: string) => {
      start(raw);
    },
    [start],
  );

  const stop = useCallback(() => {
    const current = active.current;
    if (!current) return;
    active.current = null;
    // Stopped right away; whatever the aborted stream still delivers is stale.
    dispatch({ type: 'stopped', id: current.id });
    current.controller.abort();
  }, []);

  const reset = useCallback(() => {
    const current = active.current;
    active.current = null;
    current?.controller.abort();
    dispatch({ type: 'reset' });
  }, []);

  // A failed answer is asked again in its place (it goes, the new one comes
  // last); a stopped one stays, since it holds what had arrived.
  const retry = useCallback(
    (id: string) => {
      const message = messages.find((m) => m.id === id);
      if (message) start(message.question, message.status === 'error' ? id : undefined);
    },
    [messages, start],
  );

  useEffect(
    () => () => {
      active.current?.controller.abort();
    },
    [],
  );

  // Write when a message starts or ends (ids and statuses), not on every token.
  // The first ready commit holds exactly what was restored: remember it, don't write it back.
  const saved = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const key = storageKey(messages);
    if (saved.current === null) {
      saved.current = key;
      return;
    }
    if (key === saved.current) return;
    saved.current = key;
    saveChat(messages);
  }, [ready, messages]);

  return {
    messages,
    ready,
    isStreaming: messages.some((m) => m.status === 'streaming'),
    ask,
    stop,
    retry,
    reset,
  };
}
