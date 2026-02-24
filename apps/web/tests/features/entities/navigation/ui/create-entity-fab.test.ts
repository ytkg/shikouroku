import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const routerPath = path.resolve(currentDir, "../../../../../src/app/router.tsx");
const headerPath = path.resolve(currentDir, "../../../../../src/widgets/header/ui/app-header.tsx");
const fabPath = path.resolve(currentDir, "../../../../../src/widgets/fab/ui/app-create-entity-fab.tsx");

describe("create entity fab", () => {
  it("router に FAB を配置し、新規作成導線を常時表示する", () => {
    const source = fs.readFileSync(routerPath, "utf-8");

    expect(source).toContain("CreateEntityFab");
    expect(source).toContain("<CreateEntityFab />");
  });

  it("FAB は /login・/entities/new・編集画面で非表示になり、/entities/new へ遷移する", () => {
    const source = fs.readFileSync(fabPath, "utf-8");

    expect(source).toContain("matchPath(routePaths.entityEditPattern, pathname)");
    expect(source).toContain("pathname === routePaths.login || pathname === routePaths.newEntity || isEditPage");
    expect(source).toContain("return null;");
    expect(source).toContain("to={routePaths.newEntity}");
    expect(source).toContain("aria-label=\"嗜好を追加\"");
    expect(source).toContain("env(safe-area-inset-bottom)");
  });

  it("ヘッダーの既存新規追加ボタンを削除して導線をFABへ一本化する", () => {
    const source = fs.readFileSync(headerPath, "utf-8");

    expect(source).not.toContain("size=\"icon\"");
    expect(source).not.toContain("routePaths.newEntity");
    expect(source).not.toContain("aria-label=\"新規登録\"");
  });
});
