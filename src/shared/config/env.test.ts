import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { serverEnvSchema } from './env';

const server = z.object(serverEnvSchema);

describe('serverEnvSchema', () => {
  it('defaults the token delay to 35 ms and the alerts delay to 1200 ms', () => {
    expect(server.parse({})).toEqual({ MOCK_TOKEN_DELAY_MS: 35, MOCK_ALERTS_DELAY_MS: 1200 });
  });

  it('coerces "0" to 0', () => {
    expect(server.parse({ MOCK_TOKEN_DELAY_MS: '0', MOCK_ALERTS_DELAY_MS: '0' })).toEqual({
      MOCK_TOKEN_DELAY_MS: 0,
      MOCK_ALERTS_DELAY_MS: 0,
    });
  });

  it('rejects negative and non-numeric delays', () => {
    expect(server.safeParse({ MOCK_TOKEN_DELAY_MS: '-1' }).success).toBe(false);
    expect(server.safeParse({ MOCK_TOKEN_DELAY_MS: 'abc' }).success).toBe(false);
    expect(server.safeParse({ MOCK_ALERTS_DELAY_MS: '-1' }).success).toBe(false);
  });
});
