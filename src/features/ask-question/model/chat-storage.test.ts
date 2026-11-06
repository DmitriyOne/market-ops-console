// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatMessage } from './chat-reducer';
import { CHAT_STORAGE_KEY, loadChat, MAX_STORED_MESSAGES, saveChat } from './chat-storage';

const message = (id: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  question: `Question ${id}`,
  text: `Answer ${id}`,
  status: 'done',
  kind: 'normal',
  citations: [{ marketId: 'de', period: '2026-03', label: 'Germany, Mar 2026' }],
  confidence: 'high',
  error: null,
  notice: null,
  ...over,
});

describe('chat storage (sessionStorage)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips a conversation', () => {
    const messages = [
      message('a'),
      message('b', { status: 'error', error: { key: 'errors.server' } }),
    ];
    saveChat(messages);
    expect(loadChat()).toEqual(messages);
  });

  it('restores an answer that was still streaming as stopped', () => {
    saveChat([message('a', { status: 'streaming', kind: null, confidence: null, citations: [] })]);
    expect(loadChat()[0]?.status).toBe('stopped');
  });

  it('keeps only the last MAX_STORED_MESSAGES messages', () => {
    saveChat(Array.from({ length: MAX_STORED_MESSAGES + 5 }, (_, i) => message(String(i))));
    const loaded = loadChat();
    expect(loaded).toHaveLength(MAX_STORED_MESSAGES);
    expect(loaded[0]?.id).toBe('5');
  });

  it.each([
    ['not JSON', '{oops'],
    ['another version', JSON.stringify({ v: 0, messages: [] })],
    ['a bad message', JSON.stringify({ v: 1, messages: [{ id: 1 }] })],
  ])('starts empty and warns when the stored value is %s', (_name, raw) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    sessionStorage.setItem(CHAT_STORAGE_KEY, raw);
    expect(loadChat()).toEqual([]);
    expect(warn).toHaveBeenCalledWith('[chat]', 'chat_dropped', {});
  });

  it('works without storage, silently when it is blocked', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(() => {
      saveChat([message('a')]);
    }).not.toThrow();
    expect(loadChat()).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when the chat cannot be saved because storage is full', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    saveChat([message('a'), message('b')]);
    expect(warn).toHaveBeenCalledWith('[chat]', 'chat_not_saved', { messages: 2 });
  });

  it('does not warn when nothing was stored', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(loadChat()).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });
});
