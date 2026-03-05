import { type ReactNode, useEffect, useRef, useState } from "react";

type EntityPageActionRowProps = {
  leftAction: ReactNode;
  rightAction: ReactNode;
};

export function EntityPageActionRow({
  leftAction,
  rightAction
}: EntityPageActionRowProps) {
  const actionRowRef = useRef<HTMLDivElement | null>(null);
  const [isActionRowVisible, setIsActionRowVisible] = useState(true);

  useEffect(() => {
    const target = actionRowRef.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActionRowVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={actionRowRef} className="flex w-full items-center justify-between">
        {leftAction}
        {rightAction}
      </div>
      {!isActionRowVisible && (
        <div className="pointer-events-none fixed bottom-[calc(2rem+1rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-3xl -translate-x-1/2 px-4">
          <div className="flex w-full justify-end">
            <div className="pointer-events-auto">{rightAction}</div>
          </div>
        </div>
      )}
    </>
  );
}
