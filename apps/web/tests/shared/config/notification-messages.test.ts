import { describe, expect, it } from "vitest";
import {
  notificationMessageKeys,
  notificationMessages
} from "@/shared/config/notification-messages";

describe("notification messages", () => {
  it("messageKey から固定文言を解決できる", () => {
    expect(notificationMessages[notificationMessageKeys.entryCreateSuccess]).toBe("作成しました");
    expect(notificationMessages[notificationMessageKeys.entryUpdateSuccess]).toBe("更新しました");
    expect(notificationMessages[notificationMessageKeys.tagAddSuccess]).toBe("タグを追加しました");
    expect(notificationMessages[notificationMessageKeys.tagRemoveSuccess]).toBe("タグを削除しました");
    expect(notificationMessages[notificationMessageKeys.relationAddSuccess]).toBe("関連を追加しました");
    expect(notificationMessages[notificationMessageKeys.relationRemoveSuccess]).toBe("関連を解除しました");
    expect(notificationMessages[notificationMessageKeys.imageAddSuccess]).toBe("画像を追加しました");
    expect(notificationMessages[notificationMessageKeys.imageRemoveSuccess]).toBe("画像を削除しました");
    expect(notificationMessages[notificationMessageKeys.commonSaveError]).toBe("保存に失敗しました");
    expect(notificationMessages[notificationMessageKeys.commonDeleteError]).toBe("削除に失敗しました");
    expect(notificationMessages[notificationMessageKeys.commonNetworkError]).toBe(
      "通信に失敗しました。時間をおいて再度お試しください"
    );
  });
});
