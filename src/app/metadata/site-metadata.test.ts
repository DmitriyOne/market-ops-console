import { describe, expect, it } from 'vitest';

import { siteMetadata } from './site-metadata';

describe('siteMetadata', () => {
  it.each([
    ['en-GB', 'Market Ops Console', 'Sales performance'],
    ['de-DE', 'Market Ops Console', 'Vertriebsleistung'],
    ['ru-RU', 'Market Ops Console', 'Продажи'],
  ] as const)('%s has a translated title and description', (locale, title, description) => {
    const meta = siteMetadata(locale);
    expect(meta.title).toEqual({ default: title, template: `%s · ${title}` });
    expect(String(meta.description)).toContain(description);
  });

  it('keeps the internal console out of search engines', () => {
    expect(siteMetadata('en-US').robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
  });
});
