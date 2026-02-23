import { ApiError } from "@/shared/api/api-error";
import {
  notificationMessageKeys,
  type NotificationMessageKey
} from "@/shared/config/notification-messages";

type OperationKind = "save" | "delete";

export function resolveOperationErrorMessageKey(
  error: unknown,
  operationKind: OperationKind
): NotificationMessageKey {
  if (!(error instanceof ApiError)) {
    return notificationMessageKeys.commonNetworkError;
  }

  if (operationKind === "delete") {
    return notificationMessageKeys.commonDeleteError;
  }

  return notificationMessageKeys.commonSaveError;
}
