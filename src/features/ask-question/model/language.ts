// A letter outside A–Z: Cyrillic, umlauts, accents. German without umlauts
// is not caught; accepted (owner decision, 2026-11-03).
const NON_ENGLISH_LETTER = /(?![A-Za-z])\p{L}/u;

export function isEnglish(text: string): boolean {
  return !NON_ENGLISH_LETTER.test(text);
}
