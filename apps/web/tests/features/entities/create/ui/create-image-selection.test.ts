import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const createPagePath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/create/ui/create-entity-page-content.tsx"
);
const imageUploadFieldPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-image-upload-field.tsx"
);
const createFormPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/create/model/use-create-entity-form.ts"
);
const imageOperationModelPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/model/image-operation-status.ts"
);
const imageOperationCardPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-image-operation-status-card.tsx"
);

describe("create entity image selection", () => {
  it("入力クリア前に FileList を配列化してフォームへ渡す", () => {
    const source = fs.readFileSync(imageUploadFieldPath, "utf-8");

    expect(source).toContain(
      "const files = event.target.files ? Array.from(event.target.files) : [];"
    );

    const selectCallIndex = source.indexOf("onSelectImageFiles(files);");
    const clearCallIndex = source.indexOf('event.target.value = "";');

    expect(selectCallIndex).toBeGreaterThan(-1);
    expect(clearCallIndex).toBeGreaterThan(-1);
    expect(selectCallIndex).toBeLessThan(clearCallIndex);
    expect(source).toContain("<EntityImageOperationStatusCard operationStatus={operationStatus} />");
  });

  it("フォームは File[] を受け取り、遅延評価の Array.from(files) を使わない", () => {
    const source = fs.readFileSync(createFormPath, "utf-8");

    expect(source).toContain("onSelectImageFiles: (files: File[]) => void;");
    expect(source).toContain("const onSelectImageFiles = (files: File[]) => {");
    expect(source).toContain("setSelectedImageFiles((current) => [...current, ...files]);");
    expect(source).not.toContain("const onSelectImageFiles = (files: FileList | null)");
    expect(source).not.toContain("...Array.from(files)");
  });

  it("新規登録画面のソースに登録結果ブロックが存在しない", () => {
    const source = fs.readFileSync(createPagePath, "utf-8");

    expect(source).not.toContain("登録結果");
  });

  it("フォームモデルのソースに submitResult が存在しない", () => {
    const source = fs.readFileSync(createFormPath, "utf-8");

    expect(source).not.toContain("submitResult");
  });

  it("登録成功時は作成したエンティティの詳細画面へ遷移する", () => {
    const source = fs.readFileSync(createPagePath, "utf-8");

    expect(source).toContain("<EntityImageUploadField");
    expect(source).toContain("operationStatus={form.imageOperationStatus}");
    expect(source).toContain("const createdEntityId = await form.submit();");
    expect(source).toContain("if (createdEntityId) {");
    expect(source).toContain("navigate(getEntityDetailPath(createdEntityId));");
  });

  it("createフォームは画像操作ステータスを直近操作単位で更新する", () => {
    const source = fs.readFileSync(createFormPath, "utf-8");
    const cardSource = fs.readFileSync(imageOperationCardPath, "utf-8");
    const modelSource = fs.readFileSync(imageOperationModelPath, "utf-8");

    expect(source).toContain("const [imageOperationStatus, setImageOperationStatus] = useState<ImageOperationStatus>");
    expect(source).toContain("setImageOperationStatus(createProcessingImageOperationStatus(\"upload\", selectedImageFiles.length));");
    expect(source).toContain("setImageOperationStatus(createProcessingImageOperationStatus(\"retry\", failedImageFiles.length));");
    expect(source).toContain("updateProcessingImageOperationStatus({");
    expect(source).toContain("finalizeImageOperationStatus({");
    expect(cardSource).toContain("操作ステータス");
    expect(cardSource).toContain("を処理中...");
    expect(cardSource).toContain("進捗:");
    expect(cardSource).toContain("アップロード");
    expect(cardSource).toContain("削除");
    expect(cardSource).toContain("完了: 成功");
    expect(cardSource).toContain("失敗理由");
    expect(cardSource).toContain("その他");
    expect(modelSource).toContain("return \"other\";");
  });
});
