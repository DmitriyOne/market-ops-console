import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

// Header row and the portfolio's 13 markets, 48 px each (a 44 px cell and its gap).
const ROWS = 14;

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
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex flex-col gap-1">
          {Array.from({ length: ROWS }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-11 w-full max-w-md" />
      </CardContent>
    </Card>
  );
}
