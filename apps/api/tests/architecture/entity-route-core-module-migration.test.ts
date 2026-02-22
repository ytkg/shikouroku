import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ENTITY_ROUTES_PATH = path.resolve(__dirname, "../../src/routes/api/entity-routes.ts");

describe("entity route core module migration", () => {
  it("uses entity module handlers instead of legacy entities-usecase", () => {
    const source = fs.readFileSync(ENTITY_ROUTES_PATH, "utf8");

    expect(source.includes("modules/catalog/entity/application")).toBe(true);
    expect(source.includes("usecases/entities-usecase")).toBe(false);
  });
});
