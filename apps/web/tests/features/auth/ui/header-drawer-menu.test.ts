import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const headerPath = path.resolve(currentDir, "../../../../src/widgets/header/ui/app-header.tsx");
const footerPath = path.resolve(currentDir, "../../../../src/widgets/footer/ui/app-footer.tsx");

describe("header drawer menu", () => {
  it("ヘッダーにハンバーガー起点の右ドロワーを持ち、aria属性を付与する", () => {
    const source = fs.readFileSync(headerPath, "utf-8");

    expect(source).toContain("aria-label=\"メニューを開く\"");
    expect(source).toContain("aria-haspopup=\"dialog\"");
    expect(source).toContain("id=\"app-navigation-drawer\"");
    expect(source).toContain("role=\"dialog\"");
    expect(source).toContain("aria-modal=\"true\"");
    expect(source).toContain("aria-label=\"メニュー\"");
  });

  it("ドロワーは Esc・Tab・外側クリックに対応し、フォーカストラップを持つ", () => {
    const source = fs.readFileSync(headerPath, "utf-8");

    expect(source).toContain("event.key === \"Escape\"");
    expect(source).toContain("event.key === \"Tab\"");
    expect(source).toContain("event.target === event.currentTarget");
    expect(source).toContain("previousFocusedElement?.focus();");
  });

  it("ログアウト導線はドロワー最下部に集約し、確認なしでログイン画面へ遷移する", () => {
    const headerSource = fs.readFileSync(headerPath, "utf-8");
    const footerSource = fs.readFileSync(footerPath, "utf-8");

    expect(headerSource).toContain("const { data: isAuthenticated } = useAuthStatus();");
    expect(headerSource).not.toContain("const showMenu");
    expect(headerSource).toContain("mt-auto border-t pt-3");
    expect(headerSource).toContain("{isAuthenticated ? (");
    expect(headerSource).toContain("<Link to={routePaths.login}>ログイン</Link>");
    expect(headerSource).toContain("onClick={logout}");
    expect(headerSource).toContain("await logoutRequest().catch(() => undefined);");
    expect(headerSource).toContain("navigate(routePaths.login, { replace: true });");
    expect(footerSource).not.toContain("logoutRequest");
    expect(footerSource).not.toContain("ログアウト");
  });
});
