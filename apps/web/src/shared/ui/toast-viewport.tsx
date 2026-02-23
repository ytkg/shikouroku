import { useEffect, useMemo, useSyncExternalStore } from "react";
import { notificationStore } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";

function useNotifications() {
  return useSyncExternalStore(
    notificationStore.subscribe,
    () => notificationStore.getSnapshot().items,
    () => []
  );
}

export function ToastViewport() {
  const notifications = useNotifications();
  const canPauseByHover = useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(hover: hover)").matches;
  }, []);

  useEffect(() => {
    if (notifications.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      notificationStore.clearExpired();
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [notifications.length]);

  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-50 flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:w-auto sm:max-w-md"
      aria-label="通知"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "pointer-events-auto rounded-md border p-3 shadow-md",
            notification.type === "error"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
          )}
          role={notification.type === "error" ? "alert" : "status"}
          aria-live={notification.type === "error" ? "assertive" : "polite"}
          onMouseEnter={() => {
            if (!canPauseByHover) {
              return;
            }
            notificationStore.pause(notification.id);
          }}
          onMouseLeave={() => {
            if (!canPauseByHover) {
              return;
            }
            notificationStore.resume(notification.id);
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">{notification.message}</p>
            <button
              type="button"
              className="rounded-sm border px-1.5 py-0.5 text-xs"
              onClick={() => notificationStore.dismiss(notification.id)}
              aria-label="通知を閉じる"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
