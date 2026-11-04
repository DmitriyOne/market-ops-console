import { z } from 'zod';

import {
  answerKindSchema,
  citationSchema,
  confidenceSchema,
  type ErrorMessageKey,
} from '@/shared/api';

import type { ChatMessage } from './chat-reducer';

/**
 * The conversation in sessionStorage (owner, 2026-11-04): it survives a
 * reload of the same tab and ends with the tab. Not localStorage: no
 * transcript left on a shared computer, no races between tabs.
 */
export const CHAT_STORAGE_KEY = 'mo:chat:v1';
export const MAX_STORED_MESSAGES = 50;

const errorKeySchema: z.ZodType<ErrorMessageKey> = z.enum([
  'errors.timeout',
  'errors.network',
  'errors.server',
  'errors.invalidData',
  'errors.unknown',
]);

const messageSchema = z.object({
  id: z.string(),
  question: z.string(),
  text: z.string(),
  status: z.enum(['streaming', 'done', 'stopped', 'error']),
  kind: answerKindSchema.nullable(),
  citations: z.array(citationSchema),
  confidence: confidenceSchema.nullable(),
  error: z.object({ key: errorKeySchema }).nullable(),
  notice: z.literal('englishOnly').nullable(),
}) satisfies z.ZodType<ChatMessage>;

// A new shape gets a new version; an old one is dropped, not migrated.
const storedSchema = z.object({ v: z.literal(1), messages: z.array(messageSchema) });

const asSettled = (m: ChatMessage): ChatMessage =>
  m.status === 'streaming' ? { ...m, status: 'stopped' } : m;

/** The stored conversation, or none when it is missing, unreadable or old. */
export function loadChat(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (raw === null) return [];
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    // Nothing streams after a reload; an edited or future "streaming" would lock the composer.
    return parsed.success ? parsed.data.messages.map(asSettled) : [];
  } catch {
    return [];
  }
}

/** Stores the last messages; an answer still streaming is kept as stopped. */
export function saveChat(messages: ChatMessage[]): void {
  try {
    const kept = messages.slice(-MAX_STORED_MESSAGES).map(asSettled);
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ v: 1, messages: kept }));
  } catch {
    // Blocked or full storage: the chat still works, it just won't survive a reload.
  }
}
