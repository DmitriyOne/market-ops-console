import { cn } from '@/shared/lib';

type SparkPoint = { value: number; marked?: boolean };

type SparklineProps = {
  points: SparkPoint[];
  /** Accessible name; without it the line is decoration (the number is in text nearby). */
  label?: string;
  width?: number;
  height?: number;
  /** Fill under the line. */
  area?: boolean;
  className?: string;
};

const PAD = 5;

/**
 * A small trend line in the current text colour. The last point is
 * emphasised; `marked` points (anomalies) get an off-track ring.
 */
export function Sparkline({
  points,
  label,
  width = 268,
  height = 56,
  area = true,
  className,
}: SparklineProps) {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = points.length > 1 ? (width - PAD * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => ({
    ...p,
    x: PAD + i * step,
    y: PAD + (1 - (p.value - min) / span) * (height - PAD * 2),
  }));
  const line = xy.map((p) => `${String(p.x)},${String(p.y)}`).join(' ');
  const first = xy[0];
  const last = xy.at(-1);
  const fill =
    area && first && last
      ? `${String(first.x)},${String(height)} ${line} ${String(last.x)},${String(height)}`
      : '';
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'w-full overflow-visible text-foreground motion-safe:animate-reveal-x',
        className,
      )}
    >
      {fill ? <polygon points={fill} className="fill-muted" /> : null}
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {xy
        .filter((p) => p.marked)
        .map((p) => (
          <circle
            key={p.x}
            cx={p.x}
            cy={p.y}
            r="4"
            strokeWidth="2"
            className="fill-popover stroke-status-off-track"
          />
        ))}
      {last ? <circle cx={last.x} cy={last.y} r="3" className="fill-current" /> : null}
    </svg>
  );
}
