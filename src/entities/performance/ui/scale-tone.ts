/** CSS colour of a scale step's palette slot (`--scale-div-N` / `--scale-seq-N`). */
export function toneFill(scale: 'diverging' | 'sequential', tone: number): string {
  return `var(--scale-${scale === 'diverging' ? 'div' : 'seq'}-${String(tone)})`;
}

/** Text on that slot: black or white, whichever reads (tokens.test.ts). */
export function toneText(scale: 'diverging' | 'sequential', tone: number): string {
  return `var(--scale-${scale === 'diverging' ? 'div' : 'seq'}-${String(tone)}-foreground)`;
}
