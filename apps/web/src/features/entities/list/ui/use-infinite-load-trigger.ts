import { useEffect, useRef } from "react";

type UseInfiniteLoadTriggerInput = {
  enabled: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void>;
};

export function useInfiniteLoadTrigger({
  enabled,
  isLoading,
  isLoadingMore,
  onLoadMore
}: UseInfiniteLoadTriggerInput) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const autoLoadPendingRef = useRef(false);

  useEffect(() => {
    if (!isLoadingMore) {
      autoLoadPendingRef.current = false;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    const triggerElement = triggerRef.current;
    if (!enabled || !triggerElement || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || autoLoadPendingRef.current || isLoadingMore) {
          return;
        }

        autoLoadPendingRef.current = true;
        void onLoadMore();
      },
      {
        rootMargin: "240px 0px"
      }
    );

    observer.observe(triggerElement);
    return () => {
      observer.disconnect();
    };
  }, [enabled, isLoading, isLoadingMore, onLoadMore]);

  return triggerRef;
}
