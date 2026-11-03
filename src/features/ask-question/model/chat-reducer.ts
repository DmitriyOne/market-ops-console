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
  /** `message`: text the server sent in an `error` event; `key`: a client-side cause. */
  error: { message: string } | { key: ErrorMessageKey } | null;
};

export type ChatAction =
  | { type: 'started'; id: string; question: string }
  | { type: 'token'; id: string; value: string }
  | {
      type: 'done';
      id: string;
      kind: AnswerKind;
      citations: Citation[];
      confidence: Confidence;
    }
  | { type: 'failed'; id: string; error: ChatMessage['error'] }
  | { type: 'stopped'; id: string };

function settle(
  message: ChatMessage,
  action: Exclude<ChatAction, { type: 'started' }>,
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
  if (action.type === 'started') {
    return [
      ...state,
      {
        id: action.id,
        question: action.question,
        text: '',
        status: 'streaming',
        kind: null,
        citations: [],
        confidence: null,
        error: null,
      },
    ];
  }
  return state.map((message) =>
    message.id === action.id && message.status === 'streaming' ? settle(message, action) : message,
  );
}
