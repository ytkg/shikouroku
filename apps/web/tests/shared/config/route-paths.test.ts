import { describe, expect, it } from "vitest";
import {
  getLoginPath,
  getEntityDetailPath,
  getEntityEditPath,
  isSafeReturnToPath,
  resolveReturnToPath,
  routePaths
} from "@/shared/config/route-paths";

describe("route-paths", () => {
  it("固定ルート定数が期待値を持つ", () => {
    expect(routePaths.home).toBe("/");
    expect(routePaths.login).toBe("/login");
    expect(routePaths.newEntity).toBe("/entities/new");
    expect(routePaths.notFound).toBe("*");
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

  it("returnTo の安全性を判定する", () => {
    expect(isSafeReturnToPath("/entities/new")).toBe(true);
    expect(isSafeReturnToPath("/entities/id-1/edit?tab=images")).toBe(true);
    expect(isSafeReturnToPath("https://example.com")).toBe(false);
    expect(isSafeReturnToPath("//example.com")).toBe(false);
  });

  it("ログインパスは安全な returnTo のみを付与する", () => {
    expect(getLoginPath("/entities/new")).toBe("/login?returnTo=%2Fentities%2Fnew");
    expect(getLoginPath("https://example.com")).toBe("/login");
    expect(getLoginPath(null)).toBe("/login");
  });

  it("returnTo は不正値の場合に home へフォールバックする", () => {
    expect(resolveReturnToPath("/entities/new")).toBe("/entities/new");
    expect(resolveReturnToPath("https://example.com")).toBe("/");
    expect(resolveReturnToPath(null)).toBe("/");
  });
});
