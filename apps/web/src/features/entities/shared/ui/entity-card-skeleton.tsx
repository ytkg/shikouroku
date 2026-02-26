import { Skeleton } from "@/shared/ui/skeleton";

type EntityCardSkeletonProps = {
  className?: string;
};

export function EntityCardSkeleton({ className }: EntityCardSkeletonProps) {
  return (
    <article className={`rounded-xl border border-border/70 bg-card/95 p-4 ${className ?? ""}`} aria-hidden="true">
      <div className="space-y-2">
        <div className="flex flex-wrap items-start gap-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-16 w-16 rounded-lg" />
        </div>
      </div>
    </article>
  );
}
