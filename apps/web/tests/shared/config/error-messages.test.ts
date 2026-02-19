import { describe, expect, it } from "vitest";
import { errorMessages } from "@/shared/config/error-messages";

describe("error-messages", () => {
  it("共通エラーメッセージ定数が期待値を持つ", () => {
    expect(errorMessages.unknown).toBe("unknown error");
    expect(errorMessages.entityNotFound).toBe("データが見つかりませんでした");
    expect(errorMessages.invalidEntityId).toBe("嗜好 ID が不正です");
    expect(errorMessages.kindRequired).toBe("種別を選択してください");
    expect(errorMessages.tagNameRequired).toBe("タグ名を入力してください");
  });
});
