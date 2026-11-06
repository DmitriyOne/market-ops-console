import { env } from './env';

const LOCAL = 'http://localhost:3000';

/**
 * The absolute address metadata needs (the preview image's URL): the address
 * set for the site, else the production domain Vercel provides, else the
 * local server. Server only: it reads a server variable.
 */
export function siteUrl(): URL {
  if (env.NEXT_PUBLIC_SITE_URL) return new URL(env.NEXT_PUBLIC_SITE_URL);
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return new URL(LOCAL);
}
