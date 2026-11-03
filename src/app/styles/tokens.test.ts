// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./globals.css', import.meta.url)), 'utf8');

function readTheme(selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No "${selector}" block in globals.css`);
  const body = css.slice(start, css.indexOf('}', start));
  return new Map(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name = '', value = '']) => [
      name,
      value.trim(),
    ]),
  );
}

// WCAG relative luminance straight from OKLCH: OKLab -> linear sRGB (Björn Ottosson's matrices).
function luminance(value: string): number {
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (!match) throw new Error(`Not an opaque oklch() colour: ${value}`);
  const [l, c, h] = match.slice(1).map(Number) as [number, number, number];
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l1 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m1 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s1 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const red = clamp(4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1);
  const green = clamp(-1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1);
  const blue = clamp(-0.0041960863 * l1 - 0.7034186147 * m1 + 1.707614701 * s1);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(theme: Map<string, string>, front: string, back: string): number {
  const read = (name: string) => {
    const value = theme.get(name);
    if (!value) throw new Error(`Token --${name} is missing`);
    return luminance(value);
  };
  const [hi, lo] = [read(front), read(back)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const statuses = ['on-track', 'at-risk', 'off-track'];
const scaleSteps = ['1', '2', '3', '4', '5', '6', '7'];

// [foreground, background, minimum ratio]: 4.5 for text, 3 for control borders and chart marks.
const pairs: [string, string, number][] = [
  ['foreground', 'background', 4.5],
  ['foreground', 'card', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'card', 4.5],
  ['muted-foreground', 'muted', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['destructive', 'card', 4.5],
  ['foreground', 'surface-ai', 4.5],
  ['surface-ai-label', 'surface-ai', 4.5],
  ['muted-foreground', 'surface-ai', 4.5],
  ...statuses.flatMap((s): [string, string, number][] => [
    [`status-${s}`, `status-${s}-muted`, 4.5],
    [`status-${s}`, 'card', 4.5],
  ]),
  ...scaleSteps.map((n): [string, string, number] => [`scale-${n}-foreground`, `scale-${n}`, 4.5]),
  ['input', 'background', 3],
  ['input', 'card', 3],
  ['ring', 'background', 3],
  ['chart-1', 'card', 3],
  ['chart-2', 'card', 3],
  ['chart-3', 'card', 3],
  ['chart-4', 'card', 3],
];

describe.each([':root', '.dark'])('design tokens in %s', (selector) => {
  const theme = readTheme(selector);

  it.each(pairs)('%s on %s meets %d:1', (front, back, min) => {
    expect(contrast(theme, front, back)).toBeGreaterThanOrEqual(min);
  });
});
