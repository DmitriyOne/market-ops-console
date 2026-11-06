import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { useHydrated } from './use-hydrated';

function Probe() {
  return <span>{useHydrated() ? 'client' : 'server'}</span>;
}

describe('useHydrated', () => {
  it('is false in the server HTML and while hydrating, so they match; true right after', async () => {
    const html = renderToString(<Probe />);
    expect(html).toContain('server');
    const container = document.createElement('div');
    container.innerHTML = html;
    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <Probe />, { onRecoverableError });
      await Promise.resolve();
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe('client');
  });
});
