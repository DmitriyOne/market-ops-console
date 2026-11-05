import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

// The portfolio's 13 markets, 48 px each (a 44 px cell and its 2 px gaps).
const ROWS = 13;

export function HeatMapSkeleton() {
  return (
    <Card aria-hidden className="gap-3 border border-border ring-0">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex flex-col gap-1">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-40" />
        </CardTitle>
        <Skeleton className="h-11 w-72 rounded-lg" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Notice, legend, month row, 13 rows, the line under the grid, hint, notes. */}
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-full rounded-sm" />
          {Array.from({ length: ROWS }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-11 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </CardContent>
    </Card>
  );
}
