import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const createFormPath = path.resolve(
  currentDir,
  "../../../../src/features/entities/create/model/use-create-entity-form.ts"
);
const editFormPath = path.resolve(
  currentDir,
  "../../../../src/features/entities/edit/model/use-edit-entity-form.ts"
);
const tagStatePath = path.resolve(
  currentDir,
  "../../../../src/features/entities/manage-tags/model/use-tag-edit-dialog-state.ts"
);
const appRouterPath = path.resolve(currentDir, "../../../../src/app/router.tsx");
const toastViewportPath = path.resolve(currentDir, "../../../../src/shared/ui/toast-viewport.tsx");

describe("entity operation notification coverage", () => {
  it("作成/編集/タグ/関連/画像の主要操作にnotify(messageKey)が実装されている", () => {
    const createSource = fs.readFileSync(createFormPath, "utf-8");
    const editSource = fs.readFileSync(editFormPath, "utf-8");
    const tagSource = fs.readFileSync(tagStatePath, "utf-8");

    expect(createSource).toContain("notificationMessageKeys.entryCreateSuccess");
    expect(createSource).toContain("notificationMessageKeys.relationAddSuccess");
    expect(createSource).toContain("notificationMessageKeys.imageAddSuccess");
    expect(createSource).toContain("resolveOperationErrorMessageKey(e, \"save\")");
    expect(editSource).toContain("notificationMessageKeys.entryUpdateSuccess");
    expect(editSource).toContain("notificationMessageKeys.relationAddSuccess");
    expect(editSource).toContain("notificationMessageKeys.relationRemoveSuccess");
    expect(editSource).toContain("notificationMessageKeys.imageAddSuccess");
    expect(editSource).toContain("notificationMessageKeys.imageRemoveSuccess");
    expect(editSource).toContain("resolveOperationErrorMessageKey(e, \"delete\")");
    expect(tagSource).toContain("notificationMessageKeys.tagAddSuccess");
    expect(tagSource).toContain("notificationMessageKeys.tagRemoveSuccess");
  });

  it("通知はルート常設表示で画面遷移時も欠落しない構成になっている", () => {
    const routerSource = fs.readFileSync(appRouterPath, "utf-8");
    const viewportSource = fs.readFileSync(toastViewportPath, "utf-8");

    expect(routerSource).toContain("<ToastViewport />");
    expect(viewportSource).toContain("bottom-3 right-3");
    expect(viewportSource).toContain("aria-live={notification.type === \"error\" ? \"assertive\" : \"polite\"}");
    expect(viewportSource).toContain("notificationStore.pause(notification.id)");
  });
});
