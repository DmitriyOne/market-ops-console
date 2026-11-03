import { describe, expect, it } from 'vitest';

import raw from '@/data/fixtures.json';
import { type ChatEvent, chatEventSchema, fixturesSchema, streamSse } from '@/shared/api';
import { API_ROUTES } from '@/shared/config';

import { chatFromFixture, chatStream, server } from './index';

const fixtures = fixturesSchema.parse(raw);

async function collect(): Promise<ChatEvent[]> {
  const events: ChatEvent[] = [];
  await streamSse(
    API_ROUTES.chat,
    { question: 'x' },
    {
      onData: (data) => {
        events.push(chatEventSchema.parse(JSON.parse(data)));
      },
    },
  );
  return events;
}

describe('chat MSW handlers', () => {
  it('streams fixture at-risk as tokens then done', async () => {
    server.use(chatFromFixture('at-risk'));
    const events = await collect();
    const fixture = fixtures.fixtures.find((f) => f.id === 'at-risk');
    const tokens = events.flatMap((e) => (e.type === 'token' ? [e.value] : []));
    expect(tokens.join('')).toBe(fixture?.answer.text);
    const last = events.at(-1);
    expect(last?.type).toBe('done');
    if (last?.type !== 'done') return;
    expect(last.citations).toHaveLength(4);
  });

  it('streams the error fixture as one error event', async () => {
    server.use(chatFromFixture('error'));
    const events = await collect();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('error');
  });

  it('answers with the given HTTP status', async () => {
    server.use(chatStream([], { status: 500 }));
    await expect(collect()).rejects.toMatchObject({ name: 'HttpError' });
  });
});
