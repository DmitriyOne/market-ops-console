import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';
import { createTranslator } from 'next-intl';

import {
  type AppLocale,
  deMessages,
  enMessages,
  type MessagesFile,
  messagesFileFor,
  ruMessages,
} from '@/shared/config';

const MESSAGES: Record<MessagesFile, typeof enMessages> = {
  en: enMessages,
  de: deMessages,
  ru: ruMessages,
};

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

/*
 * next/og draws without our stylesheet, so the light theme's tokens are
 * repeated here as hex (globals.css: --background, --foreground,
 * --muted-foreground, --border). ADR 0018 lists this exception.
 */
const COLOR = {
  background: '#f3f5f7',
  foreground: '#0d1117',
  muted: '#4d5664',
  border: '#d3d9e0',
};

const FONT_DIR = join(process.cwd(), 'src/app/metadata/og-fonts');

/*
 * Space Grotesk as in the app; it has no Cyrillic, so Inter fills those
 * glyphs (the app falls back to system-ui for ru-RU, ADR 0014). Committed
 * TTF files (SIL OFL, licences beside them): no network at build.
 */
async function fonts() {
  const file = (name: string) => readFile(join(FONT_DIR, name));
  const [grotesk, groteskBold, inter, interBold] = await Promise.all([
    file('SpaceGrotesk-Regular.ttf'),
    file('SpaceGrotesk-SemiBold.ttf'),
    file('Inter-Regular.ttf'),
    file('Inter-SemiBold.ttf'),
  ]);
  return [
    { name: 'Space Grotesk', data: grotesk, weight: 400 as const },
    { name: 'Space Grotesk', data: groteskBold, weight: 600 as const },
    { name: 'Inter', data: inter, weight: 400 as const },
    { name: 'Inter', data: interBold, weight: 600 as const },
  ];
}

const translator = (locale: AppLocale) =>
  createTranslator({ locale, messages: MESSAGES[messagesFileFor(locale)] });

/** The preview image's alt text in the page language. */
export function ogImageAlt(locale: AppLocale): string {
  const t = translator(locale);
  return t('meta.ogAlt', { appName: t('common.appName'), description: t('common.description') });
}

/** The link preview image: logo, app name, description, in the page language. */
export async function ogImage(locale: AppLocale): Promise<ImageResponse> {
  const t = translator(locale);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: COLOR.background,
        color: COLOR.foreground,
        fontFamily: 'Space Grotesk, Inter',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 112,
          height: 112,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 28,
          background: COLOR.foreground,
        }}
      >
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
          <path
            d="M5.5 18V6.5L12 13l6.5-6.5V18"
            stroke={COLOR.background}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: -2 }}>
          {t('common.appName')}
        </div>
        <div
          style={{
            fontSize: 36,
            lineHeight: 1.35,
            color: COLOR.muted,
            maxWidth: 960,
            paddingTop: 24,
            borderTop: `2px solid ${COLOR.border}`,
          }}
        >
          {t('common.description')}
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await fonts() },
  );
}
