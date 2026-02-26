import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const authGuardPath = path.resolve(currentDir, "../../../../src/features/auth/model/use-auth-guard.ts");
const loginFormPath = path.resolve(currentDir, "../../../../src/features/auth/login/model/use-login-form.ts");
const routePathsPath = path.resolve(currentDir, "../../../../src/shared/config/route-paths.ts");

describe("auth guard returnTo flow", () => {
  it("401発生時は現在URLをreturnTo化してログインへreplace遷移する", () => {
    const source = fs.readFileSync(authGuardPath, "utf-8");

    expect(source).toContain("if (status === httpStatus.unauthorized)");
    expect(source).toContain("const returnTo = buildReturnTo(location.pathname, location.search);");
    expect(source).toContain("navigate(getLoginPath(returnTo), { replace: true });");
    expect(source).toContain("void setUnauthenticated();");
    expect(source).toContain("return false;");
  });

  it("login成功時はreturnToを安全に解決し、replace遷移で元画面へ戻す", () => {
    const source = fs.readFileSync(loginFormPath, "utf-8");

    expect(source).toContain("const searchParams = new URLSearchParams(location.search);");
    expect(source).toContain("const returnTo = resolveReturnToPath(searchParams.get(\"returnTo\"));");
    expect(source).toContain("navigate(returnTo, { replace: true });");
    expect(source).toContain("await setAuthenticated();");
  });

  it("returnToは安全な同一オリジン相対パスのみ許可し、login URLへ埋め込む", () => {
    const source = fs.readFileSync(routePathsPath, "utf-8");

    expect(source).toContain("export function isSafeReturnToPath(value: string): boolean");
    expect(source).toContain("if (!value.startsWith(\"/\") || value.startsWith(\"//\"))");
    expect(source).toContain("return isSafeReturnToPath(returnTo) ? returnTo : routePaths.home;");
    expect(source).toContain("searchParams.set(\"returnTo\", returnTo);");
    expect(source).toContain("return `${routePaths.login}?${searchParams.toString()}`;");
  });
});
