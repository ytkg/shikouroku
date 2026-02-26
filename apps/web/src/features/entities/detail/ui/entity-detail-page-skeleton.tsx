import { EntityPageActionRow } from "../../shared/ui/entity-page-action-row";
import { EntityCardSkeleton } from "../../shared/ui/entity-card-skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function EntityDetailPageSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-4 pt-16">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-10" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-10" />
            <div className="grid grid-cols-4 gap-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="aspect-square w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <EntityCardSkeleton />
            <EntityCardSkeleton />
          </div>
        </CardContent>
      </Card>
      <EntityPageActionRow
        leftAction={<Skeleton className="h-9 w-28" />}
        rightAction={<Skeleton className="h-9 w-20" />}
      />
    </main>
  );
}
