import { Skeleton } from "@/shared/ui/skeleton";

export function EntityMapLocationListSkeleton() {
  return (
    <div className="h-full overflow-y-auto rounded-xl border border-border/70 bg-card/95 p-2" aria-hidden="true">
      <ul className="space-y-2">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={`entity-map-list-skeleton-${index}`}>
            <div className="rounded-lg border border-border/70 bg-card/95 p-2">
              <Skeleton className="h-4 w-40" />
              <div className="mt-2 flex flex-wrap gap-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
