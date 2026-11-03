import { describe, expect, it } from 'vitest';

import type { Citation } from '@/shared/api';

import { type ChatAction, type ChatMessage, chatReducer } from './chat-reducer';

const citations: Citation[] = [{ marketId: 'de', period: '2026-05', label: 'Germany · May 2026' }];

function run(...actions: ChatAction[]): ChatMessage[] {
  return actions.reduce(chatReducer, []);
}

const started: ChatAction = { type: 'started', id: 'a', question: 'Why Germany?' };

describe('chatReducer', () => {
  it('starts an empty streaming message', () => {
    expect(run(started)).toEqual([
      {
        id: 'a',
        question: 'Why Germany?',
        text: '',
        status: 'streaming',
        kind: null,
        citations: [],
        confidence: null,
        error: null,
      },
    ]);
  });

  it('appends tokens', () => {
    const [m] = run(
      started,
      { type: 'token', id: 'a', value: 'Germany ' },
      { type: 'token', id: 'a', value: 'dipped.' },
    );
    expect(m?.text).toBe('Germany dipped.');
  });

  it('sets kind, citations and confidence on done', () => {
    const [m] = run(started, {
      type: 'done',
      id: 'a',
      kind: 'normal',
      citations,
      confidence: 'high',
    });
    expect(m).toMatchObject({ status: 'done', kind: 'normal', citations, confidence: 'high' });
  });

  it('ignores a token after stopped and keeps the partial text', () => {
    const [m] = run(
      started,
      { type: 'token', id: 'a', value: 'Germany ' },
      { type: 'stopped', id: 'a' },
      { type: 'token', id: 'a', value: 'dipped.' },
      { type: 'done', id: 'a', kind: 'normal', citations, confidence: 'high' },
    );
    expect(m).toMatchObject({
      status: 'stopped',
      text: 'Germany ',
      citations: [],
      confidence: null,
    });
  });

  it('turns done with kind error into an error with errors.server', () => {
    const [m] = run(started, {
      type: 'done',
      id: 'a',
      kind: 'error',
      citations: [],
      confidence: 'low',
    });
    expect(m).toMatchObject({ status: 'error', error: { key: 'errors.server' }, confidence: null });
  });

  it('keeps the partial text when it fails', () => {
    const [m] = run(
      started,
      { type: 'token', id: 'a', value: 'Germany ' },
      { type: 'failed', id: 'a', error: { key: 'errors.network' } },
    );
    expect(m).toMatchObject({
      status: 'error',
      text: 'Germany ',
      error: { key: 'errors.network' },
    });
  });

  it('changes only the message the action names', () => {
    const messages = run(
      started,
      { type: 'stopped', id: 'a' },
      { type: 'started', id: 'b', question: 'Again' },
      { type: 'token', id: 'a', value: 'stale' },
      { type: 'token', id: 'b', value: 'fresh' },
    );
    expect(messages.map((m) => m.text)).toEqual(['', 'fresh']);
  });
});
