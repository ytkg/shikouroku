import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MAINTENANCE_ROUTES_PATH = path.resolve(__dirname, "../../src/routes/api/maintenance-routes.ts");

describe("maintenance route module migration", () => {
  it("uses maintenance module handlers instead of legacy image-cleanup-usecase", () => {
    const source = fs.readFileSync(MAINTENANCE_ROUTES_PATH, "utf8");

    expect(source.includes("modules/maintenance/image-cleanup/application")).toBe(true);
    expect(source.includes("usecases/image-cleanup-usecase")).toBe(false);
  });
});
