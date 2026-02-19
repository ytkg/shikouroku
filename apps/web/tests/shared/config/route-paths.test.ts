import { describe, expect, it } from "vitest";
import {
  getEntityDetailPath,
  getEntityEditPath,
  routePaths
} from "@/shared/config/route-paths";

describe("route-paths", () => {
  it("固定ルート定数が期待値を持つ", () => {
    expect(routePaths.home).toBe("/");
    expect(routePaths.login).toBe("/login");
    expect(routePaths.newEntity).toBe("/entities/new");
    expect(routePaths.entityDetailPattern).toBe("/entities/:entityId");
    expect(routePaths.entityEditPattern).toBe("/entities/:entityId/edit");
  });

  it("動的ルートを生成できる", () => {
    expect(getEntityDetailPath("abc")).toBe("/entities/abc");
    expect(getEntityEditPath("abc")).toBe("/entities/abc/edit");
  });

  it("entityIdの特殊文字をURLエンコードする", () => {
    expect(getEntityDetailPath("id with/slash")).toBe("/entities/id%20with%2Fslash");
    expect(getEntityEditPath("id with/slash")).toBe("/entities/id%20with%2Fslash/edit");
  });

  it("entityIdが既にエンコード済みでも二重エンコードしない", () => {
    expect(getEntityDetailPath("id%20with%2Fslash")).toBe("/entities/id%20with%2Fslash");
    expect(getEntityEditPath("id%20with%2Fslash")).toBe("/entities/id%20with%2Fslash/edit");
  });
});
