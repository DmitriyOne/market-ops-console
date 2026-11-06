import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

type Attributes = Record<string, unknown>;
const span = vi.hoisted(() => ({
  setAttributes: vi.fn<(attributes: Attributes) => void>(),
  setStatus: vi.fn<(status: { code: number }) => void>(),
  end: vi.fn<() => void>(),
}));
vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/nextjs')>()),
  startInactiveSpan: vi.fn(() => span),
}));

const { chatFromFixture, server } = await import('@/shared/lib/test');
const { useChatStream } = await import('./use-chat-stream');

const attributes = (): Attributes =>
  span.setAttributes.mock.calls.reduce<Attributes>((all, [a]) => ({ ...all, ...a }), {});

describe('useChatStream span (ADR 0019)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    span.setAttributes.mockReset();
    span.setStatus.mockReset();
    span.end.mockReset();
    sessionStorage.clear();
  });

  it('times an answer to the first token and to the end, with kind and confidence', async () => {
    server.use(chatFromFixture('at-risk'));
    const { result } = renderHook(() => useChatStream());
    act(() => {
      result.current.ask('Which markets are at risk?');
    });
    await waitFor(() => {
      expect(span.end).toHaveBeenCalledOnce();
    });
    const { 'chat.first_token_ms': firstToken, 'chat.total_ms': total, ...rest } = attributes();
    expect(rest).toEqual({ 'chat.kind': 'normal', 'chat.confidence': 'high', 'chat.citations': 4 });
    expect(typeof firstToken).toBe('number');
    expect(typeof total).toBe('number');
    expect(span.setStatus).toHaveBeenCalledWith({ code: 1 });
    expect(JSON.stringify(span.setAttributes.mock.calls)).not.toContain('at risk');
  });

  it('ends the span as an error when the answer fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(chatFromFixture('error'));
    const { result } = renderHook(() => useChatStream());
    act(() => {
      result.current.ask('Break, please');
    });
    await waitFor(() => {
      expect(span.end).toHaveBeenCalledOnce();
    });
    expect(span.setStatus).toHaveBeenCalledWith({ code: 2 });
  });
});
