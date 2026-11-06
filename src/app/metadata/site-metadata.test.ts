import { describe, expect, it } from 'vitest';

import { siteMetadata } from './site-metadata';

describe('siteMetadata', () => {
  it.each([
    ['en-GB', 'Sales performance'],
    ['de-DE', 'Vertriebsleistung'],
    ['ru-RU', 'Продажи'],
  ] as const)('%s has a translated title template and description', (locale, description) => {
    const meta = siteMetadata(locale);
    expect(meta.title).toEqual({
      default: 'Market Ops Console',
      template: '%s · Market Ops Console',
    });
    expect(String(meta.description)).toContain(description);
  });

  it('describes the link preview in the page language', () => {
    const meta = siteMetadata('de-DE');
    expect(meta.openGraph).toMatchObject({
      type: 'website',
      siteName: 'Market Ops Console',
      locale: 'de_DE',
    });
    expect(String(meta.openGraph?.description)).toContain('Vertriebsleistung');
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('gives relative image URLs an absolute base', () => {
    expect(String(siteMetadata('en-GB').metadataBase)).toBe('http://localhost:3000/');
  });

  it('keeps the internal console out of search engines', () => {
    expect(siteMetadata('en-US').robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
  });
});
