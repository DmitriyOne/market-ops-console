import { afterEach, describe, expect, it, vi } from 'vitest';

type SiteEnv = { NEXT_PUBLIC_SITE_URL?: string; VERCEL_PROJECT_PRODUCTION_URL?: string };
const env = vi.hoisted((): SiteEnv => ({}));
vi.mock('./env', () => ({ env }));

const { siteUrl } = await import('./site-url');

describe('siteUrl', () => {
  afterEach(() => {
    env.NEXT_PUBLIC_SITE_URL = undefined;
    env.VERCEL_PROJECT_PRODUCTION_URL = undefined;
  });

  it('prefers the address set for the site', () => {
    env.NEXT_PUBLIC_SITE_URL = 'https://ops.example.com';
    env.VERCEL_PROJECT_PRODUCTION_URL = 'ops.vercel.app';
    expect(siteUrl().href).toBe('https://ops.example.com/');
  });

  it("falls back to Vercel's production domain over https", () => {
    env.VERCEL_PROJECT_PRODUCTION_URL = 'ops.vercel.app';
    expect(siteUrl().href).toBe('https://ops.vercel.app/');
  });

  it('uses the local server when nothing is set', () => {
    expect(siteUrl().href).toBe('http://localhost:3000/');
  });
});
