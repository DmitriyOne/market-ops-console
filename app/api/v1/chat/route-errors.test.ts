// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// A broken fixtures file must surface as a JSON server error, not a crash.
vi.mock('@/data/fixtures.json', () => ({ default: { fixtures: 'not an array' } }));

describe('POST /api/v1/chat with invalid fixtures', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers 500 data_integrity and logs once', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/v1/chat', {
        method: 'POST',
        body: JSON.stringify({ question: 'germany' }),
      }),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: { code: 'data_integrity' } });
    expect(log).toHaveBeenCalledOnce();
  });

  it('answers 400 for a malformed request even when fixtures are broken', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/v1/chat', { method: 'POST', body: JSON.stringify({}) }),
    );
    expect(response.status).toBe(400);
  });
});
