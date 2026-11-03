import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';

// ADR 0014. Space Grotesk has no Cyrillic: ru-RU text falls back to system-ui by design.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const fontVariables = `${spaceGrotesk.variable} ${jetBrainsMono.variable}`;
