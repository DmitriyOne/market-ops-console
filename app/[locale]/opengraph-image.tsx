import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';

import { OG_CONTENT_TYPE, OG_SIZE, ogImage, ogImageAlt } from '@/app/metadata';
import { routing } from '@/shared/config';

// One preview image for the whole site, per language (ADR 0018); every page
// under the locale inherits it. Drawn on the first request, then cached.
export function generateImageMetadata({ params }: { params: { locale: string } }) {
  const locale = hasLocale(routing.locales, params.locale) ? params.locale : routing.defaultLocale;
  return [{ id: 'preview', alt: ogImageAlt(locale), size: OG_SIZE, contentType: OG_CONTENT_TYPE }];
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return ogImage(locale);
}
