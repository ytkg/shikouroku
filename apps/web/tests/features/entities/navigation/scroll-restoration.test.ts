import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const routerPath = path.resolve(currentDir, "../../../../src/app/router.tsx");

describe("scroll restoration", () => {
  it("pathname と search の変化時に先頭へスクロールする", () => {
    const source = fs.readFileSync(routerPath, "utf-8");

    expect(source).toContain("const location = useLocation();");
    expect(source).toContain("window.scrollTo({ top: 0, left: 0, behavior: \"auto\" });");
    expect(source).toContain("[location.pathname, location.search]");
  });
});
