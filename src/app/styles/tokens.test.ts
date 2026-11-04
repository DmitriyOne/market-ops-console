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

const root = readTheme(':root');

// A token the theme does not redefine comes from :root; `var(--x)` aliases
// resolve in the theme, as the browser does on an element inside it.
function resolve(theme: Map<string, string>, name: string): string {
  const value = theme.get(name) ?? root.get(name);
  if (!value) throw new Error(`Token --${name} is missing`);
  const alias = /^var\(--([\w-]+)\)$/.exec(value);
  return alias?.[1] ? resolve(theme, alias[1]) : value;
}

function contrast(theme: Map<string, string>, front: string, back: string): number {
  const read = (name: string) => luminance(resolve(theme, name));
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
  // Assistant panel: confidence line on the AI surface, source buttons, error text.
  ['confidence-high', 'surface-ai', 4.5],
  ['confidence-medium', 'surface-ai', 4.5],
  ['confidence-low', 'surface-ai', 4.5],
  ['surface-ai-label', 'background', 4.5],
  ['foreground', 'status-off-track-muted', 4.5],
  ['status-at-risk', 'surface-ai', 4.5],
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

// OKLab distance ×100 (the dataviz skill's ΔE): 15 is the normal-vision floor.
function deltaE(theme: Map<string, string>, x: string, y: string): number {
  const lab = (name: string) => {
    const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(resolve(theme, name));
    if (!match) throw new Error(`Not an opaque oklch() colour: --${name}`);
    const [l, c, h] = match.slice(1).map(Number) as [number, number, number];
    return [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
  };
  const [p, q] = [lab(x), lab(y)];
  return 100 * Math.hypot(...p.map((v, i) => v - (q[i] ?? 0)));
}
const lightness = (theme: Map<string, string>, name: string) =>
  Number(/^oklch\(([\d.]+)/.exec(resolve(theme, name))?.[1]);

const diverging = ['1', '2', '3', '4', '5', '6'].map((n) => `scale-div-${n}`);
const sequential = ['1', '2', '3', '4', '5'].map((n) => `scale-seq-${n}`);

describe.each([':root', '.dark'])('map scales in %s', (selector) => {
  const theme = readTheme(selector);

  it('every diverging step and the plain land differ by ΔE ≥ 15', () => {
    const set = [...diverging, 'map-land'];
    for (const [i, x] of set.entries()) {
      for (const y of set.slice(i + 1)) {
        expect(deltaE(theme, x, y), `${x} vs ${y}`).toBeGreaterThanOrEqual(15);
      }
    }
  });

  // The skill's ramp rule (validate_palette --ordinal): monotone lightness, ΔL ≥ 0.06 per step.
  it('the sequential ramp is monotone with a visible gap per step', () => {
    const l = sequential.map((name) => lightness(theme, name));
    const sign = selector === ':root' ? -1 : 1; // light: more = darker; dark: more = lighter
    for (const [i, next] of l.slice(1).entries()) {
      expect(sign * (next - (l[i] ?? 0))).toBeGreaterThanOrEqual(0.06);
    }
  });

  it('the faintest sequential step stands out from the land (≥ 2:1)', () => {
    expect(contrast(theme, 'scale-seq-1', 'map-land')).toBeGreaterThanOrEqual(2);
  });

  it('the sea differs from the land', () => {
    expect(deltaE(theme, 'map-sea', 'map-land')).toBeGreaterThan(2);
  });
});
