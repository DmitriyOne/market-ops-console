import { describe, expect, it } from 'vitest';

import { fitView, mainBox, WORLD } from './map-fit';

// A flat projection: x = lon, y = −lat, so boxes are easy to read.
const project = ([lon, lat]: [number, number]): [number, number] => [lon, 0 - lat + 0];
const invert = ([x, y]: [number, number]): [number, number] => [x, -y];
const square = (x: number, y: number, size: number) => [
  [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
    [x, y],
  ],
];

describe('mainBox', () => {
  it('a polygon gives its projected box', () => {
    expect(mainBox({ type: 'Polygon', coordinates: square(0, 0, 10) }, project)).toEqual([
      [0, -10],
      [10, 0],
    ]);
  });

  it('a multipolygon gives the box of its largest part (France, not French Guiana)', () => {
    const geometry = {
      type: 'MultiPolygon' as const,
      coordinates: [square(-53, 2, 3), square(-5, 42, 13)],
    };
    expect(mainBox(geometry, project)).toEqual([
      [-5, -55],
      [8, -42],
    ]);
  });
});

describe('fitView', () => {
  const size = { width: 800, height: 356 };

  it('no boxes is the whole world', () => {
    expect(fitView([], size, invert)).toEqual(WORLD);
  });

  it('centres on the union of the boxes and zooms to fit them with a margin', () => {
    const view = fitView(
      [
        [
          [100, 50],
          [200, 100],
        ],
        [
          [250, 80],
          [300, 150],
        ],
      ],
      size,
      invert,
    );
    expect(view.center).toEqual([200, -100]);
    // 200 × 100 box in 800 × 356: height limits, 3.56 × 0.8.
    expect(view.zoom).toBeCloseTo(2.848, 3);
  });

  it('zoom is never below the world or above the cap', () => {
    const tiny: [[number, number], [number, number]] = [
      [10, 10],
      [11, 11],
    ];
    expect(fitView([tiny], size, invert).zoom).toBe(5);
    const huge: [[number, number], [number, number]] = [
      [-1000, -1000],
      [1000, 1000],
    ];
    expect(fitView([huge], size, invert).zoom).toBe(1);
  });
});
