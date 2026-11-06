import { describe, expect, it } from 'vitest';

import { OG_SIZE, ogImageAlt } from './og-image';

describe('preview image', () => {
  it('is the size link previews expect', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });

  it.each([
    ['en-GB', 'Market Ops Console. Sales performance'],
    ['de-DE', 'Market Ops Console. Vertriebsleistung'],
    ['ru-RU', 'Market Ops Console. Продажи'],
  ] as const)('%s describes the image in its language', (locale, start) => {
    expect(ogImageAlt(locale).startsWith(start)).toBe(true);
  });
});
