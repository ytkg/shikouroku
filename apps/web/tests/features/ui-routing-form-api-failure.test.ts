import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(currentDir, "../../src");

const routerPath = path.resolve(srcRoot, "app/router.tsx");
const loginPagePath = path.resolve(srcRoot, "features/auth/login/ui/login-page-content.tsx");
const loginFormPath = path.resolve(srcRoot, "features/auth/login/model/use-login-form.ts");
const createPagePath = path.resolve(srcRoot, "features/entities/create/ui/create-entity-page-content.tsx");
const createFormPath = path.resolve(srcRoot, "features/entities/create/model/use-create-entity-form.ts");
const editPagePath = path.resolve(srcRoot, "features/entities/edit/ui/edit-entity-page-content.tsx");
const editFormPath = path.resolve(srcRoot, "features/entities/edit/model/use-edit-entity-form.ts");

describe("ui integration: routing + form + api failure", () => {
  it("login 画面はルート定義・フォーム送信・API失敗時表示を一貫して持つ", () => {
    const routerSource = fs.readFileSync(routerPath, "utf-8");
    const pageSource = fs.readFileSync(loginPagePath, "utf-8");
    const formSource = fs.readFileSync(loginFormPath, "utf-8");

    expect(routerSource).toContain("path={routePaths.login}");
    expect(routerSource).toContain("<LoginPage />");

    expect(pageSource).toContain("const onSubmit = async (event: FormEvent<HTMLFormElement>) => {");
    expect(pageSource).toContain("event.preventDefault();");
    expect(pageSource).toContain("await form.submit();");
    expect(pageSource).toContain("{form.error && <p className=\"text-sm text-destructive\">{form.error}</p>}");

    expect(formSource).toContain("if (e instanceof ApiError) {");
    expect(formSource).toContain("setError(e.message);");
    expect(formSource).toContain("navigate(returnTo, { replace: true });");
    expect(formSource).toContain("finally {");
    expect(formSource).toContain("setLoading(false);");
  });

  it("新規登録はルート遷移とフォーム送信を結合し、API失敗時に認可分岐とエラー通知を行う", () => {
    const routerSource = fs.readFileSync(routerPath, "utf-8");
    const pageSource = fs.readFileSync(createPagePath, "utf-8");
    const formSource = fs.readFileSync(createFormPath, "utf-8");

    expect(routerSource).toContain("path={routePaths.newEntity}");
    expect(routerSource).toContain("<NewEntityPage />");

    expect(pageSource).toContain("const onSubmit = async (event: FormEvent<HTMLFormElement>) => {");
    expect(pageSource).toContain("event.preventDefault();");
    expect(pageSource).toContain("const createdEntityId = await form.submit();");
    expect(pageSource).toContain("if (createdEntityId) {");
    expect(pageSource).toContain("navigate(getEntityDetailPath(createdEntityId));");
    expect(pageSource).toContain("{form.error && <p className=\"text-sm text-destructive\">{form.error}</p>}");

    expect(formSource).toContain("if (e instanceof ApiError && !ensureAuthorized(e.status)) {");
    expect(formSource).toContain("return null;");
    expect(formSource).toContain("setError(toErrorMessage(e));");
    expect(formSource).toContain("messageKey: resolveOperationErrorMessageKey(e, \"save\")");
  });

  it("編集は edit ルートで保存導線を提供し、API失敗時に認可分岐とエラー表示を維持する", () => {
    const routerSource = fs.readFileSync(routerPath, "utf-8");
    const pageSource = fs.readFileSync(editPagePath, "utf-8");
    const formSource = fs.readFileSync(editFormPath, "utf-8");

    expect(routerSource).toContain("path={routePaths.entityEditPattern}");
    expect(routerSource).toContain("<EntityEditPage />");

    expect(pageSource).toContain("const onSave = async () => {");
    expect(pageSource).toContain("const saved = await form.save();");
    expect(pageSource).toContain("if (saved) {");
    expect(pageSource).toContain("navigate(detailPath);");
    expect(pageSource).toContain("<Button onClick={() => void onSave()} disabled={form.saving}>");
    expect(pageSource).toContain("{form.error && <p className=\"text-sm text-destructive\">{form.error}</p>}");

    expect(formSource).toContain("if (e instanceof ApiError && !ensureAuthorized(e.status)) {");
    expect(formSource).toContain("return false;");
    expect(formSource).toContain("setError(toErrorMessage(e));");
    expect(formSource).toContain("messageKey: resolveOperationErrorMessageKey(e, \"save\")");
  });
});
