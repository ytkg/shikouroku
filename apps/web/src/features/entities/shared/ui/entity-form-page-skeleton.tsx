import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { EntityPageActionRow } from "./entity-page-action-row";

export function EntityFormPageSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-4 pt-20">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
      <EntityPageActionRow
        leftAction={<Skeleton className="h-9 w-28" />}
        rightAction={<Skeleton className="h-9 w-24" />}
      />
    </main>
  );
}
