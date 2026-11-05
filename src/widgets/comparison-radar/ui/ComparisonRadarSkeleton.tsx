import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

export function ComparisonRadarSkeleton() {
  return (
    <Card aria-hidden className="gap-3 border border-border ring-0">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex flex-col gap-1">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-48" />
        </CardTitle>
        <Skeleton className="h-11 w-36 rounded-lg" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}
