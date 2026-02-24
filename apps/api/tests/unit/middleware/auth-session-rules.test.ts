import { describe, expect, it } from "vitest";
import {
  buildLoginPathWithReturnTo,
  canAccessApiWithoutAuth,
  isAuthRequiredSpaPath
} from "../../../src/middleware/auth-session-rules";

describe("authSessionRules", () => {
  it("匿名許可APIを判定できる", () => {
    expect(canAccessApiWithoutAuth("POST", "/api/login")).toBe(true);
    expect(canAccessApiWithoutAuth("GET", "/api/entities")).toBe(true);
    expect(canAccessApiWithoutAuth("GET", "/api/entities/id-1/images/img-1/file")).toBe(true);
    expect(canAccessApiWithoutAuth("GET", "/api/maintenance/image-cleanup/tasks")).toBe(false);
    expect(canAccessApiWithoutAuth("POST", "/api/entities")).toBe(false);
  });

  it("保護対象SPAパスを判定できる", () => {
    expect(isAuthRequiredSpaPath("/entities/new")).toBe(true);
    expect(isAuthRequiredSpaPath("/entities/id-1/edit")).toBe(true);
    expect(isAuthRequiredSpaPath("/entities/id-1")).toBe(false);
  });

  it("returnTo付きログインURLを組み立てる", () => {
    expect(buildLoginPathWithReturnTo("http://localhost/entities/new?draft=true")).toBe(
      "/login?returnTo=%2Fentities%2Fnew%3Fdraft%3Dtrue"
    );
  });
});
