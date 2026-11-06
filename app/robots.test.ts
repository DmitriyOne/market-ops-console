import { describe, expect, it } from 'vitest';

import robots from './robots';

describe('robots.txt', () => {
  it('keeps every crawler out and lists no sitemap', () => {
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });
});
