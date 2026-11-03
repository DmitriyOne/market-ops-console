import { act, renderHook, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { chatFromFixture, chatStream, fixtureEvents, server } from '@/shared/lib/test';

import { useChatStream } from './use-chat-stream';

function tokensOf(id: string): string[] {
  return fixtureEvents(id).flatMap((e) => (e.type === 'token' ? [e.value] : []));
}

function setup() {
  return renderHook(() => useChatStream());
}

describe('useChatStream', () => {
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

  it('error fixture ends in error with the event message', async () => {
    server.use(chatFromFixture('error'));
    const { result } = setup();
    act(() => {
      result.current.ask('force error');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.status).toBe('error');
    });
    const event = fixtureEvents('error')[0];
    expect(result.current.messages[0]?.error).toEqual({
      message: event?.type === 'error' ? event.message : '',
    });
  });

  it('HTTP 500 ends in error with key errors.server', async () => {
    server.use(chatStream([], { status: 500 }));
    const { result } = setup();
    act(() => {
      result.current.ask('anything');
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.error).toEqual({ key: 'errors.server' });
    });
  });

  it('invalid event ends in error with key errors.invalidData', async () => {
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
