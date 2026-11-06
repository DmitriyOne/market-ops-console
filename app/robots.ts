import type { MetadataRoute } from 'next';

// An internal console: no crawling at all, so no sitemap either (owner,
// 2026-11-03 and 2026-11-06; ADR 0018). The pages also carry `noindex`.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } };
}
