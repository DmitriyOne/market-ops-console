import { act, renderHook, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STREAM_FIRST_EVENT_TIMEOUT_MS } from '@/shared/api';
import { chatFromFixture, chatStream, fixtureEvents, server } from '@/shared/lib/test';

import { useChatStream } from './use-chat-stream';

function tokensOf(id: string): string[] {
  return fixtureEvents(id).flatMap((e) => (e.type === 'token' ? [e.value] : []));
}

function setup() {
  return renderHook(() => useChatStream());
}

// Chat failures are logged; keep the test output clean and assert on it.
function consoleErrors() {
  return vi.spyOn(console, 'error').mockImplementation(() => undefined);
}

describe('useChatStream', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('streams at-risk to done', async () => {
    server.use(chatFromFixture('at-risk'));
    const { result } = setup();
    act(() => {
      result.current.ask('  Which markets are at risk?  ');
    });
    expect(result.current.isStreaming).toBe(true);
    await waitFor(() => {
      expect(result.current.messages[0]?.status).toBe('done');
    });
    const [m] = result.current.messages;
    expect(m?.question).toBe('Which markets are at risk?');
    expect(m?.text).toBe(tokensOf('at-risk').join(''));
    expect(m?.citations).toHaveLength(4);
    expect(m?.confidence).toBe('high');
    expect(result.current.isStreaming).toBe(false);
  });

  it('an error event shows the translated server error and logs the server text', async () => {
    const errors = consoleErrors();
    server.use(chatFromFixture('error'));
    const { result } = setup();
    act(() => {
      result.current.ask('force error');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.status).toBe('error');
    });
    expect(result.current.messages[0]?.error).toEqual({ key: 'errors.server' });
    const event = fixtureEvents('error')[0];
    expect(errors).toHaveBeenCalledWith(
      '[chat]',
      expect.objectContaining({
        code: 'ChatServerError',
        message: event?.type === 'error' ? event.message : '',
      }),
    );
  });

  it('done with kind error is shown as a server error and logged', async () => {
    const errors = consoleErrors();
    server.use(chatStream([{ type: 'done', kind: 'error', citations: [], confidence: 'low' }]));
    const { result } = setup();
    act(() => {
      result.current.ask('anything');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.error).toEqual({ key: 'errors.server' });
    });
    expect(errors).toHaveBeenCalledWith(
      '[chat]',
      expect.objectContaining({ code: 'ChatServerError' }),
    );
  });

  it('stop and unmount are not logged as errors', async () => {
    const errors = consoleErrors();
    server.use(chatFromFixture('germany-dip', { stallAfter: 1 }));
    const { result, unmount } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.text).not.toBe('');
    });
    act(() => {
      result.current.stop();
    });
    act(() => {
      result.current.ask('Why Germany?');
    });
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(errors).not.toHaveBeenCalled();
  });

  it('HTTP 500 ends in error with key errors.server and is logged once', async () => {
    const errors = consoleErrors();
    server.use(chatStream([], { status: 500 }));
    const { result } = setup();
    act(() => {
      result.current.ask('anything');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.error).toEqual({ key: 'errors.server' });
    });
    expect(errors).toHaveBeenCalledTimes(1);
    expect(errors.mock.calls[0]?.[0]).toBe('[chat]');
  });

  it('invalid event ends in error with key errors.invalidData', async () => {
    consoleErrors();
    // @ts-expect-error -- deliberately not a ChatEvent
    server.use(chatStream([{ type: 'nope' }]));
    const { result } = setup();
    act(() => {
      result.current.ask('anything');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.error).toEqual({ key: 'errors.invalidData' });
    });
  });

  it('data that is not JSON ends in error with key errors.invalidData', async () => {
    consoleErrors();
    server.use(
      http.post(
        '*/api/v1/chat',
        () => new Response('data: {oops\n\n', { headers: { 'Content-Type': 'text/event-stream' } }),
      ),
    );
    const { result } = setup();
    act(() => {
      result.current.ask('anything');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.error).toEqual({ key: 'errors.invalidData' });
    });
  });

  it('a stream that ends without done ends in error with key errors.network', async () => {
    consoleErrors();
    server.use(chatStream([{ type: 'token', value: 'Half ' }]));
    const { result } = setup();
    act(() => {
      result.current.ask('anything');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.status).toBe('error');
    });
    expect(result.current.messages[0]).toMatchObject({
      text: 'Half ',
      error: { key: 'errors.network' },
    });
  });

  it('a server that stays open after done does not block the next question', async () => {
    // Everything up to `done` is sent; the connection then stays open.
    const events = fixtureEvents('germany-dip');
    server.use(
      chatStream([...events, { type: 'token', value: 'never sent' }], {
        stallAfter: events.length,
      }),
    );
    const { result } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.status).toBe('done');
    });
    server.use(chatFromFixture('at-risk'));
    act(() => {
      result.current.ask('Which markets are at risk?');
    });
    expect(result.current.messages).toHaveLength(2);
    await waitFor(() => {
      expect(result.current.messages[1]?.status).toBe('done');
    });
    expect(result.current.messages[0]?.status).toBe('done');
  });

  it('no first event in time ends in error with key errors.timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    consoleErrors();
    server.use(chatFromFixture('germany-dip', { stallAfter: 0 }));
    const { result } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(STREAM_FIRST_EVENT_TIMEOUT_MS + 1);
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.error).toEqual({ key: 'errors.timeout' });
    });
  });

  it('unmounting mid-stream aborts the request', async () => {
    let signal: AbortSignal | undefined;
    server.use(
      http.post('*/api/v1/chat', ({ request }) => {
        signal = request.signal;
        return new Response(new ReadableStream({ start: () => undefined }), {
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }),
    );
    const { result, unmount } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    await waitFor(() => {
      expect(signal).toBeDefined();
    });
    unmount();
    await waitFor(() => {
      expect(signal?.aborted).toBe(true);
    });
  });

  it('reset clears the conversation and aborts a running stream', async () => {
    let signal: AbortSignal | undefined;
    server.use(
      http.post('*/api/v1/chat', ({ request }) => {
        signal = request.signal;
        return new Response(new ReadableStream({ start: () => undefined }), {
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }),
    );
    const { result } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    await waitFor(() => {
      expect(signal).toBeDefined();
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    await waitFor(() => {
      expect(signal?.aborted).toBe(true);
    });
    server.use(chatFromFixture('at-risk'));
    act(() => {
      result.current.ask('Which markets are at risk?');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.status).toBe('done');
    });
    expect(result.current.messages).toHaveLength(1);
  });

  it('a reload in the same tab restores the conversation (sessionStorage)', async () => {
    server.use(chatFromFixture('germany-dip'));
    const first = setup();
    act(() => {
      first.result.current.ask('Why Germany?');
    });
    await waitFor(() => {
      expect(first.result.current.messages[0]?.status).toBe('done');
    });
    first.unmount();
    const second = setup();
    expect(second.result.current.messages).toHaveLength(1);
    expect(second.result.current.messages[0]).toMatchObject({
      question: 'Why Germany?',
      status: 'done',
      text: tokensOf('germany-dip').join(''),
    });
  });

  it('writes the conversation when a message starts or ends, not on every token', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    server.use(chatFromFixture('germany-dip'));
    const { result } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.status).toBe('done');
    });
    expect(tokensOf('germany-dip').length).toBeGreaterThan(5);
    // Once when the question starts, once when the answer is done.
    expect(setItem.mock.calls.filter(([key]) => key === 'mo:chat:v1')).toHaveLength(2);
  });

  it('does not write back the conversation it just restored', () => {
    const stored = {
      v: 1,
      messages: [
        {
          id: 'a1',
          question: 'Why Germany?',
          text: 'Because.',
          status: 'done',
          kind: 'normal',
          citations: [],
          confidence: 'high',
          error: null,
          notice: null,
        },
      ],
    };
    sessionStorage.setItem('mo:chat:v1', JSON.stringify(stored));
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = setup();
    expect(result.current.messages).toHaveLength(1);
    expect(setItem.mock.calls.filter(([key]) => key === 'mo:chat:v1')).toHaveLength(0);
  });

  it('a stored answer marked streaming comes back stopped and does not lock the composer', () => {
    const stored = {
      v: 1,
      messages: [
        {
          id: 'a1',
          question: 'Why Germany?',
          text: 'Because',
          status: 'streaming',
          kind: null,
          citations: [],
          confidence: null,
          error: null,
          notice: null,
        },
      ],
    };
    sessionStorage.setItem('mo:chat:v1', JSON.stringify(stored));
    const { result } = setup();
    expect(result.current.messages[0]?.status).toBe('stopped');
    expect(result.current.isStreaming).toBe(false);
  });

  it('reset also clears the stored conversation', async () => {
    server.use(chatFromFixture('germany-dip'));
    const first = setup();
    act(() => {
      first.result.current.ask('Why Germany?');
    });
    await waitFor(() => {
      expect(first.result.current.messages[0]?.status).toBe('done');
    });
    act(() => {
      first.result.current.reset();
    });
    first.unmount();
    expect(setup().result.current.messages).toEqual([]);
  });

  it('stop mid-stream keeps partial text as stopped', async () => {
    server.use(chatFromFixture('germany-dip', { stallAfter: 3 }));
    const { result } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    const firstThree = tokensOf('germany-dip').slice(0, 3).join('');
    await waitFor(() => {
      expect(result.current.messages[0]?.text).toBe(firstThree);
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.messages[0]).toMatchObject({
      status: 'stopped',
      text: firstThree,
      citations: [],
      confidence: null,
    });
    expect(result.current.isStreaming).toBe(false);
  });

  it('stop before the first token leaves an empty stopped message', () => {
    server.use(chatFromFixture('germany-dip', { stallAfter: 0 }));
    const { result } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.messages[0]).toMatchObject({ status: 'stopped', text: '' });
  });

  it('stop then ask again: old stream never touches the new message', async () => {
    server.use(chatFromFixture('germany-dip', { delayMs: 5 }));
    const { result } = setup();
    act(() => {
      result.current.ask('Why Germany?');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.text).not.toBe('');
    });
    act(() => {
      result.current.stop();
    });
    server.use(chatFromFixture('at-risk'));
    act(() => {
      result.current.ask('Which markets are at risk?');
    });
    await waitFor(() => {
      expect(result.current.messages[1]?.status).toBe('done');
    });
    expect(result.current.messages[0]?.status).toBe('stopped');
    expect(result.current.messages[1]?.text).toBe(tokensOf('at-risk').join(''));
  });

  it('retry adds a new message with the same question', async () => {
    consoleErrors();
    server.use(chatFromFixture('error'));
    const { result } = setup();
    act(() => {
      result.current.ask('force error');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.status).toBe('error');
    });
    server.use(chatFromFixture('germany-dip'));
    const firstId = result.current.messages[0]?.id ?? '';
    act(() => {
      result.current.retry(firstId);
    });
    await waitFor(() => {
      expect(result.current.messages[1]?.status).toBe('done');
    });
    expect(result.current.messages[1]?.question).toBe('force error');
    expect(result.current.messages[1]?.id).not.toBe(firstId);
  });

  it.each(['Какие рынки под риском?', 'Märkte mit Risiko'])(
    'a non-English question gets the English-only reply without a request: %s',
    (question) => {
      const requests = vi.fn();
      server.use(
        http.post('*/api/v1/chat', () => {
          requests();
          return new Response(null, { status: 500 });
        }),
      );
      const { result } = setup();
      act(() => {
        result.current.ask(question);
      });
      expect(result.current.messages[0]).toMatchObject({
        question,
        status: 'done',
        notice: 'englishOnly',
      });
      expect(result.current.isStreaming).toBe(false);
      expect(requests).not.toHaveBeenCalled();
    },
  );

  it('ask while streaming is ignored, and so is a blank question', () => {
    server.use(chatFromFixture('germany-dip', { stallAfter: 0 }));
    const { result } = setup();
    act(() => {
      result.current.ask('   ');
    });
    expect(result.current.messages).toHaveLength(0);
    act(() => {
      result.current.ask('Why Germany?');
    });
    act(() => {
      result.current.ask('Second question');
    });
    expect(result.current.messages).toHaveLength(1);
  });
});
