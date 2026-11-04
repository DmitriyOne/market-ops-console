'use client';

import { cn } from 'cn';
import type * as React from 'react';
import { ResponsiveContainer } from 'recharts';

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;

/**
 * shadcn chart frame, trimmed to what the project uses: a responsive box
 * whose Recharts text and grid take the theme tokens. Series colours come
 * from token classes on each mark (`stroke-foreground`), not a config object,
 * so no inline <style> is written. Tooltip and legend are drawn by each chart
 * with the project formats (numbers through next-intl, patterns in the legend).
 */
function ChartContainer({
  className,
  children,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  children: React.ComponentProps<typeof ResponsiveContainer>['children'];
  initialDimension?: { width: number; height: number };
}) {
  return (
    <div
      data-slot="chart"
      className={cn(
        'flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden',
        className,
      )}
      {...props}
    >
      <ResponsiveContainer initialDimension={initialDimension}>{children}</ResponsiveContainer>
    </div>
  );
}

export { ChartContainer };
