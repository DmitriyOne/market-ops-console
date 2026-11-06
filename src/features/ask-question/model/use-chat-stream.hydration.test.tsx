import { act, waitFor } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { saveChat } from './chat-storage';
import { useChatStream } from './use-chat-stream';

function Probe() {
  const chat = useChatStream();
  return <p>{chat.ready ? `messages: ${String(chat.messages.length)}` : 'loading'}</p>;
}

describe('useChatStream hydration', () => {
  afterEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('server HTML and the first client render match; the stored chat arrives after', async () => {
    saveChat([
      {
        id: 'a',
        question: 'Why Germany?',
        text: 'Because.',
        status: 'done',
        kind: 'normal',
        citations: [],
        confidence: 'high',
        error: null,
        notice: null,
      },
    ]);
    const html = renderToString(<Probe />);
    // The server has no sessionStorage: it renders the not-ready state.
    expect(html).toContain('loading');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <Probe />, { onRecoverableError });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(container.textContent).toBe('messages: 1');
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
  });
});
