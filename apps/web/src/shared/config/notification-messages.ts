export const notificationMessageKeys = {
  entryCreateSuccess: "entry.create.success",
  entryUpdateSuccess: "entry.update.success",
  entryDeleteSuccess: "entry.delete.success",
  tagAddSuccess: "tag.add.success",
  tagRemoveSuccess: "tag.remove.success",
  relationAddSuccess: "relation.add.success",
  relationRemoveSuccess: "relation.remove.success",
  imageAddSuccess: "image.add.success",
  imageRemoveSuccess: "image.remove.success",
  commonSaveError: "common.save.error",
  commonDeleteError: "common.delete.error",
  commonNetworkError: "common.network.error"
} as const;

export type NotificationMessageKey =
  (typeof notificationMessageKeys)[keyof typeof notificationMessageKeys];

export const notificationMessages: Record<NotificationMessageKey, string> = {
  [notificationMessageKeys.entryCreateSuccess]: "作成しました",
  [notificationMessageKeys.entryUpdateSuccess]: "更新しました",
  [notificationMessageKeys.entryDeleteSuccess]: "削除しました",
  [notificationMessageKeys.tagAddSuccess]: "タグを追加しました",
  [notificationMessageKeys.tagRemoveSuccess]: "タグを削除しました",
  [notificationMessageKeys.relationAddSuccess]: "関連を追加しました",
  [notificationMessageKeys.relationRemoveSuccess]: "関連を解除しました",
  [notificationMessageKeys.imageAddSuccess]: "画像を追加しました",
  [notificationMessageKeys.imageRemoveSuccess]: "画像を削除しました",
  [notificationMessageKeys.commonSaveError]: "保存に失敗しました",
  [notificationMessageKeys.commonDeleteError]: "削除に失敗しました",
  [notificationMessageKeys.commonNetworkError]: "通信に失敗しました。時間をおいて再度お試しください"
};
