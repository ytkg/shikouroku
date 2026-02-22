import { describe, expect, it } from "vitest";
import { isStaticAssetPath } from "../../../../src/shared/http/asset-path";

describe("asset-path", () => {
  it("treats /assets/* as static", () => {
    expect(isStaticAssetPath("/assets/main.js")).toBe(true);
    expect(isStaticAssetPath("/assets/images/logo.svg")).toBe(true);
  });

  it("treats file-like paths as static", () => {
    expect(isStaticAssetPath("/favicon.ico")).toBe(true);
    expect(isStaticAssetPath("/robots.txt")).toBe(true);
  });

  it("does not treat route paths as static", () => {
    expect(isStaticAssetPath("/")).toBe(false);
    expect(isStaticAssetPath("/login")).toBe(false);
    expect(isStaticAssetPath("/profile.v2/edit")).toBe(false);
  });
});
