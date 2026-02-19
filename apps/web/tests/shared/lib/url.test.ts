import { describe, expect, it } from "vitest";
import { encodePathSegment } from "@/shared/lib/url";

describe("url", () => {
  it("パスセグメントをURLエンコードする", () => {
    expect(encodePathSegment("id with/slash")).toBe("id%20with%2Fslash");
  });

  it("既にエンコード済みの入力を二重エンコードしない", () => {
    expect(encodePathSegment("id%20with%2Fslash")).toBe("id%20with%2Fslash");
  });

  it("不正なエンコード文字列でも例外にせずエンコードする", () => {
    expect(encodePathSegment("%E0%A4%A")).toBe("%25E0%25A4%25A");
  });
});
