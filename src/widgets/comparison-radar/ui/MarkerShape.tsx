import type { Marker } from './series';

/** One marker centred on (cx, cy); the legend and the chart draw the same shape. */
export function MarkerShape({
  marker,
  cx,
  cy,
  fill,
  size = 4,
}: {
  marker: Marker;
  cx: number;
  cy: number;
  fill: string;
  size?: number;
}) {
  if (marker === 'none') return null;
  if (marker === 'circle') return <circle cx={cx} cy={cy} r={size} fill={fill} />;
  if (marker === 'square') {
    return <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2} fill={fill} />;
  }
  const points =
    marker === 'triangle'
      ? [
          [cx, cy - size * 1.2],
          [cx + size * 1.1, cy + size * 0.9],
          [cx - size * 1.1, cy + size * 0.9],
        ]
      : [
          [cx, cy - size * 1.3],
          [cx + size * 1.1, cy],
          [cx, cy + size * 1.3],
          [cx - size * 1.1, cy],
        ];
  return <polygon points={points.map((p) => p.join(',')).join(' ')} fill={fill} />;
}
