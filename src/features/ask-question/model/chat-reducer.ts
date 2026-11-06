import type { AnswerKind, Citation, Confidence, ErrorMessageKey } from '@/shared/api';

export type MessageStatus = 'streaming' | 'done' | 'stopped' | 'error';

export type ChatMessage = {
  id: string;
  question: string;
  text: string;
  status: MessageStatus;
  kind: AnswerKind | null;
  citations: Citation[];
  confidence: Confidence | null;
  /** Why the answer failed, as a translated message; the details go to the log. */
  error: { key: ErrorMessageKey } | null;
  /** A reply made on the client instead of asking the assistant. */
  notice: ChatNotice | null;
};

/** `englishOnly`: the question is not in English, which the mock assistant needs. */
export type ChatNotice = 'englishOnly';

export type ChatAction =
  /** `replaces`: a failed message this one asks again; it goes, the new one comes last. */
  | { type: 'started'; id: string; question: string; replaces?: string }
  | { type: 'declined'; id: string; question: string; notice: ChatNotice }
  | { type: 'token'; id: string; value: string }
  | {
      type: 'done';
      id: string;
      kind: AnswerKind;
      citations: Citation[];
      confidence: Confidence;
    }
  | { type: 'failed'; id: string; error: ChatMessage['error'] }
  | { type: 'stopped'; id: string }
  | { type: 'reset' }
  | { type: 'restore'; messages: ChatMessage[] };

function settle(
  message: ChatMessage,
  action: Exclude<ChatAction, { type: 'started' | 'declined' | 'reset' | 'restore' }>,
): ChatMessage {
  switch (action.type) {
    case 'token':
      return { ...message, text: message.text + action.value };
    case 'done':
      // A `done` that says the answer failed is an error, not an answer.
      return action.kind === 'error'
        ? { ...message, status: 'error', kind: 'error', error: { key: 'errors.server' } }
        : {
            ...message,
            status: 'done',
            kind: action.kind,
            citations: action.citations,
            confidence: action.confidence,
          };
    case 'failed':
      return { ...message, status: 'error', error: action.error };
    case 'stopped':
      return { ...message, status: 'stopped' };
  }
}

/**
 * Conversation state. Only a message that is still streaming accepts
 * actions, so events of a stopped or failed stream change nothing.
 */
export function chatReducer(state: ChatMessage[], action: ChatAction): ChatMessage[] {
  if (action.type === 'reset') return [];
  // Restored history goes before anything already in this session.
  if (action.type === 'restore') return [...action.messages, ...state];
  if (action.type === 'started' || action.type === 'declined') {
    const replaced = action.type === 'started' ? action.replaces : undefined;
    const kept = replaced
      ? state.filter((m) => !(m.id === replaced && m.status === 'error'))
      : state;
    return [
      ...kept,
      {
        id: action.id,
        question: action.question,
        text: '',
        status: action.type === 'started' ? 'streaming' : 'done',
        kind: null,
        citations: [],
        confidence: null,
        error: null,
        notice: action.type === 'declined' ? action.notice : null,
      },
    ];
  }
  return state.map((message) =>
    message.id === action.id && message.status === 'streaming' ? settle(message, action) : message,
  );
}
