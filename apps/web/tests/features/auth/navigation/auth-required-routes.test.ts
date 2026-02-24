import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const routerPath = path.resolve(currentDir, "../../../../src/app/router.tsx");

describe("auth required routes", () => {
  it("new/edit ルートはクライアント側で固定ガードせず、遷移先で401ベース制御する", () => {
    const source = fs.readFileSync(routerPath, "utf-8");

    expect(source).toContain("path={routePaths.newEntity}");
    expect(source).toContain("<NewEntityPage />");
    expect(source).toContain("path={routePaths.entityEditPattern}");
    expect(source).toContain("<EntityEditPage />");
    expect(source).not.toContain("AuthenticatedRoute");
    expect(source).not.toContain("useAuthStatus()");
  });
});
