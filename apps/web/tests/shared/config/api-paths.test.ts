import { describe, expect, it } from "vitest";
import { entityKey, isEntityDetailKey } from "@/entities/entity";
import { apiPaths, getEntityPath, getTagPath } from "@/shared/config/api-paths";

describe("api-paths", () => {
  it("固定APIパス定数が期待値を持つ", () => {
    expect(apiPaths.login).toBe("/api/login");
    expect(apiPaths.logout).toBe("/api/logout");
    expect(apiPaths.kinds).toBe("/api/kinds");
    expect(apiPaths.tags).toBe("/api/tags");
    expect(apiPaths.entities).toBe("/api/entities");
  });

  it("動的APIパスを生成できる", () => {
    expect(getTagPath(10)).toBe("/api/tags/10");
    expect(getEntityPath("entity-1")).toBe("/api/entities/entity-1");
  });

  it("entityIdの特殊文字をURLエンコードする", () => {
    expect(getEntityPath("id with/slash")).toBe("/api/entities/id%20with%2Fslash");
  });

  it("entityIdが既にエンコード済みでも二重エンコードしない", () => {
    expect(getEntityPath("id%20with%2Fslash")).toBe("/api/entities/id%20with%2Fslash");
  });

  it("entityKey は entity path と一致する", () => {
    expect(entityKey("id-1")).toBe("/api/entities/id-1");
  });

  it("isEntityDetailKey は entity detail key だけを許可する", () => {
    expect(isEntityDetailKey("/api/entities/id-1")).toBe(true);
    expect(isEntityDetailKey("/api/entities")).toBe(false);
    expect(isEntityDetailKey("/api/tags/1")).toBe(false);
    expect(isEntityDetailKey(undefined)).toBe(false);
  });
});
