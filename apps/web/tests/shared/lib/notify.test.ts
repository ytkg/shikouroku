import { describe, expect, it } from "vitest";
import { notificationMessageKeys } from "@/shared/config/notification-messages";
import { createNotificationStore } from "@/shared/lib/notify";

describe("notify store", () => {
  it("同一messageKeyの1000ms以内連続通知を抑止する", () => {
    const store = createNotificationStore();
    const firstResult = store.notify(
      { type: "success", messageKey: notificationMessageKeys.entryCreateSuccess },
      { now: 1000 }
    );
    const secondResult = store.notify(
      { type: "success", messageKey: notificationMessageKeys.entryCreateSuccess },
      { now: 1500 }
    );
    const thirdResult = store.notify(
      { type: "success", messageKey: notificationMessageKeys.entryCreateSuccess },
      { now: 2000 }
    );

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(false);
    expect(thirdResult).toBe(true);
    expect(store.getSnapshot().items).toHaveLength(2);
  });

  it("success/errorで自動dismiss時間が異なる", () => {
    const store = createNotificationStore();
    store.notify(
      { type: "success", messageKey: notificationMessageKeys.entryCreateSuccess },
      { now: 1000 }
    );
    store.notify(
      { type: "error", messageKey: notificationMessageKeys.commonSaveError },
      { now: 1000 }
    );

    store.clearExpired(4100);
    expect(store.getSnapshot().items).toHaveLength(1);
    expect(store.getSnapshot().items[0]?.type).toBe("error");

    store.clearExpired(6100);
    expect(store.getSnapshot().items).toHaveLength(0);
  });

  it("errorをsuccessより優先表示し、同時表示上限は3件", () => {
    const store = createNotificationStore();
    store.notify(
      { type: "success", messageKey: notificationMessageKeys.entryCreateSuccess },
      { now: 1000 }
    );
    store.notify(
      { type: "success", messageKey: notificationMessageKeys.entryUpdateSuccess },
      { now: 2001 }
    );
    store.notify(
      { type: "error", messageKey: notificationMessageKeys.commonSaveError },
      { now: 3002 }
    );
    store.notify(
      { type: "success", messageKey: notificationMessageKeys.imageAddSuccess },
      { now: 4003 }
    );

    const items = store.getSnapshot().items;
    expect(items).toHaveLength(3);
    expect(items[0]?.type).toBe("error");
  });

  it("pause/resume中は期限が延長される", () => {
    const store = createNotificationStore();
    store.notify(
      { type: "success", messageKey: notificationMessageKeys.entryCreateSuccess },
      { now: 1000 }
    );
    const item = store.getSnapshot().items[0];
    expect(item).toBeDefined();
    if (!item) {
      return;
    }

    store.pause(item.id, 2000);
    store.resume(item.id, 4000);
    store.clearExpired(4500);
    expect(store.getSnapshot().items).toHaveLength(1);
    store.clearExpired(7000);
    expect(store.getSnapshot().items).toHaveLength(0);
  });
});
