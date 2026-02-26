import type { RefObject } from "react";
import { Skeleton } from "@/shared/ui/skeleton";

type EntityMapCanvasProps = {
  isLoading: boolean;
  mapContainerRef: RefObject<HTMLDivElement>;
};

export function EntityMapCanvas({ isLoading, mapContainerRef }: EntityMapCanvasProps) {
  return (
    <div className="isolate relative z-0">
      <div
        ref={mapContainerRef}
        className="h-[24dvh] min-h-40 w-full overflow-hidden rounded-xl border border-border/70 bg-card/95 md:h-[36dvh] md:min-h-64"
      />
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/60">
          <div className="w-full max-w-xs space-y-2 px-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      )}
    </div>
  );
}
