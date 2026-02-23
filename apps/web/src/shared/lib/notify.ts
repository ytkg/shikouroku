import {
  notificationMessages,
  type NotificationMessageKey
} from "@/shared/config/notification-messages";

export type NotificationType = "success" | "error";

type NotifyInput = {
  type: NotificationType;
  messageKey: NotificationMessageKey;
};

type NotifyOptions = {
  now?: number;
};

type NotificationTimerState = {
  expiresAt: number;
  pausedAt: number | null;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  messageKey: NotificationMessageKey;
  message: string;
  createdAt: number;
  timer: NotificationTimerState;
};

type NotificationState = {
  items: NotificationItem[];
  lastTriggeredAtByKey: Partial<Record<NotificationMessageKey, number>>;
};

type NotificationStore = {
  getSnapshot: () => NotificationState;
  subscribe: (listener: () => void) => () => void;
  notify: (input: NotifyInput, options?: NotifyOptions) => boolean;
  dismiss: (id: string) => void;
  pause: (id: string, now?: number) => void;
  resume: (id: string, now?: number) => void;
  clearExpired: (now?: number) => void;
  clearAll: () => void;
};

const duplicateSuppressWindowMs = 1000;
const maxVisibleCount = 3;
const dismissDurationByType: Record<NotificationType, number> = {
  success: 3000,
  error: 5000
};

function isHigherPriority(type: NotificationType) {
  return type === "error" ? 0 : 1;
}

function orderNotifications(items: NotificationItem[]) {
  return [...items].sort((left, right) => {
    const priorityDiff = isHigherPriority(left.type) - isHigherPriority(right.type);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return right.createdAt - left.createdAt;
  });
}

export function createNotificationStore(): NotificationStore {
  let state: NotificationState = {
    items: [],
    lastTriggeredAtByKey: {}
  };
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (updater: (current: NotificationState) => NotificationState) => {
    state = updater(state);
    emit();
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify: (input: NotifyInput, options?: NotifyOptions) => {
      const now = options?.now ?? Date.now();
      const lastTriggeredAt = state.lastTriggeredAtByKey[input.messageKey];
      if (
        lastTriggeredAt !== undefined &&
        now - lastTriggeredAt < duplicateSuppressWindowMs
      ) {
        return false;
      }

      const item: NotificationItem = {
        id: `${now}-${Math.random().toString(16).slice(2)}`,
        type: input.type,
        messageKey: input.messageKey,
        message: notificationMessages[input.messageKey],
        createdAt: now,
        timer: {
          expiresAt: now + dismissDurationByType[input.type],
          pausedAt: null
        }
      };

      setState((current) => ({
        items: orderNotifications([...current.items, item]).slice(0, maxVisibleCount),
        lastTriggeredAtByKey: {
          ...current.lastTriggeredAtByKey,
          [input.messageKey]: now
        }
      }));
      return true;
    },
    dismiss: (id: string) => {
      setState((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== id)
      }));
    },
    pause: (id: string, now?: number) => {
      const currentTime = now ?? Date.now();
      setState((current) => ({
        ...current,
        items: current.items.map((item) => {
          if (item.id !== id || item.timer.pausedAt !== null) {
            return item;
          }
          return {
            ...item,
            timer: {
              ...item.timer,
              pausedAt: currentTime
            }
          };
        })
      }));
    },
    resume: (id: string, now?: number) => {
      const currentTime = now ?? Date.now();
      setState((current) => ({
        ...current,
        items: current.items.map((item) => {
          if (item.id !== id || item.timer.pausedAt === null) {
            return item;
          }
          return {
            ...item,
            timer: {
              expiresAt: item.timer.expiresAt + (currentTime - item.timer.pausedAt),
              pausedAt: null
            }
          };
        })
      }));
    },
    clearExpired: (now?: number) => {
      const currentTime = now ?? Date.now();
      setState((current) => ({
        ...current,
        items: current.items.filter(
          (item) => item.timer.pausedAt !== null || item.timer.expiresAt > currentTime
        )
      }));
    },
    clearAll: () => {
      setState((current) => ({
        ...current,
        items: []
      }));
    }
  };
}

export const notificationStore = createNotificationStore();

export function notify(input: NotifyInput): boolean {
  return notificationStore.notify(input);
}
