import { EntityPageActionRow } from "../../shared/ui/entity-page-action-row";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function EntityDetailPageSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-4 pt-16">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
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
