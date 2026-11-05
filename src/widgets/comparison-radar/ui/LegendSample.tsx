import { MarkerShape } from './MarkerShape';
import type { SeriesStyle } from './series';

/** The series' line, dash and marker, as the chart draws them. */
export function LegendSample({ style }: { style: SeriesStyle }) {
  return (
    <svg width="28" height="12" aria-hidden className="shrink-0">
      <line
        x1="0"
        y1="6"
        x2="28"
        y2="6"
        stroke={style.stroke}
        strokeWidth={2}
        strokeDasharray={style.dash}
      />
      <MarkerShape marker={style.marker} cx={14} cy={6} fill={style.stroke} size={3.5} />
    </svg>
  );
}
