import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { serverEnvSchema } from './env';

const server = z.object(serverEnvSchema);

describe('serverEnvSchema', () => {
  it('defaults the token delay to 35 ms and the alerts delay to 1200 ms', () => {
    expect(server.parse({})).toEqual({
      MOCK_TOKEN_DELAY_MS: 35,
      MOCK_ALERTS_DELAY_MS: 1200,
      ENABLE_SENTRY_TEST_PAGE: false,
    });
  });

  it('coerces "0" to 0', () => {
    expect(server.parse({ MOCK_TOKEN_DELAY_MS: '0', MOCK_ALERTS_DELAY_MS: '0' })).toMatchObject({
      MOCK_TOKEN_DELAY_MS: 0,
      MOCK_ALERTS_DELAY_MS: 0,
    });
  });

  it('rejects negative and non-numeric delays', () => {
    expect(server.safeParse({ MOCK_TOKEN_DELAY_MS: '-1' }).success).toBe(false);
    expect(server.safeParse({ MOCK_TOKEN_DELAY_MS: 'abc' }).success).toBe(false);
    expect(server.safeParse({ MOCK_ALERTS_DELAY_MS: '-1' }).success).toBe(false);
  });

  it('keeps the Sentry test page closed unless the variable says true', () => {
    expect(server.parse({}).ENABLE_SENTRY_TEST_PAGE).toBe(false);
    expect(server.parse({ ENABLE_SENTRY_TEST_PAGE: 'false' }).ENABLE_SENTRY_TEST_PAGE).toBe(false);
    expect(server.parse({ ENABLE_SENTRY_TEST_PAGE: 'true' }).ENABLE_SENTRY_TEST_PAGE).toBe(true);
    expect(server.safeParse({ ENABLE_SENTRY_TEST_PAGE: 'maybe' }).success).toBe(false);
  });
});
