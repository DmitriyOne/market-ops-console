// No Recharts here: the legend and the chart tooltip both draw it.
import { SERIES, type SeriesKey } from './series';

/** A line sample in the series' colour and dash pattern. */
export function LegendLine({ series }: { series: SeriesKey }) {
  const { stroke, dash, width } = SERIES[series];
  return (
    <svg width="22" height="8" aria-hidden className="shrink-0">
      <line
        x1="0"
        y1="4"
        x2="22"
        y2="4"
        stroke={stroke}
        strokeWidth={width}
        strokeDasharray={dash}
      />
    </svg>
  );
}
