import { describe, expect, it } from 'vitest';

import { MAP_SCALES, scaleSteps, stepFor } from './map-scale';

describe('stepFor', () => {
  it('attainment: five steps, an edge belongs to the upper step', () => {
    expect(stepFor('attainment', 93.9, 1)).toBe(0);
    expect(stepFor('attainment', 94, 1)).toBe(1);
    expect(stepFor('attainment', 101.99, 1)).toBe(3); // shown as 102.0 %
    expect(stepFor('attainment', 104.5, 1)).toBe(3);
    expect(stepFor('attainment', 105, 1)).toBe(4);
  });

  it('uses the shown value: 97.96 reads "98.0 %" and is not painted "94–98 %"', () => {
    expect(stepFor('attainment', 97.96, 1)).toBe(2);
    expect(stepFor('attainment', 97.94, 1)).toBe(1);
  });

  it('growth: six steps around a flat middle', () => {
    expect(stepFor('growth', -9.7, 1)).toBe(0);
    expect(stepFor('growth', -5, 1)).toBe(1);
    expect(stepFor('growth', -1.04, 1)).toBe(2); // shown as −1.0 %: on the edge, upper step
    expect(stepFor('growth', -1, 1)).toBe(2);
    expect(stepFor('growth', -1.05, 1)).toBe(1); // shown as −1.1 % (rounds away from zero)
    expect(stepFor('growth', 0.3, 1)).toBe(2);
    expect(stepFor('growth', 1, 1)).toBe(3);
    expect(stepFor('growth', 9.96, 1)).toBe(5); // shown as 10.0 %
    expect(stepFor('growth', 10, 1)).toBe(5);
    expect(stepFor('growth', 18, 1)).toBe(5);
  });

  it('share: five steps', () => {
    expect(stepFor('share', 9.9, 1)).toBe(0);
    expect(stepFor('share', 30, 1)).toBe(4);
  });

  it('revenue: monthly breaks times the months in the window', () => {
    expect(stepFor('revenue', 999_940, 1)).toBe(0); // "$999.9K"
    expect(stepFor('revenue', 999_960, 1)).toBe(1); // "$1M"
    expect(stepFor('revenue', 1_449_000, 1)).toBe(1); // "$1.4M"
    expect(stepFor('revenue', 1_450_000, 1)).toBe(2); // "$1.5M"
    expect(stepFor('revenue', 2_950_000, 1)).toBe(4); // "$3M"
    expect(stepFor('revenue', 4_400_000, 3)).toBe(1);
    expect(stepFor('revenue', 4_500_000, 3)).toBe(2);
    expect(stepFor('revenue', 35_000_000, 12)).toBe(3);
    expect(stepFor('revenue', 36_000_000, 12)).toBe(4);
  });
});

describe('MAP_SCALES', () => {
  it('growth has six steps, the others five; diverging tones keep equal arms', () => {
    expect(MAP_SCALES.growth.tones).toEqual([1, 2, 3, 4, 5, 6]);
    expect(MAP_SCALES.attainment.tones).toEqual([1, 2, 3, 5, 6]);
    expect(MAP_SCALES.share.tones).toEqual([1, 2, 3, 4, 5]);
    expect(MAP_SCALES.revenue.tones).toEqual([1, 2, 3, 4, 5]);
    for (const scale of Object.values(MAP_SCALES)) {
      expect(scale.tones).toHaveLength(scale.breaks.length + 1);
    }
  });
});

describe('scaleSteps', () => {
  it('open ends at both sides; revenue bounds follow the window', () => {
    expect(scaleSteps('attainment', 1).map((s) => [s.from, s.to])).toEqual([
      [null, 94],
      [94, 98],
      [98, 102],
      [102, 105],
      [105, null],
    ]);
    expect(scaleSteps('revenue', 3)[1]).toEqual({ from: 3_000_000, to: 4_500_000, tone: 2 });
  });
});
