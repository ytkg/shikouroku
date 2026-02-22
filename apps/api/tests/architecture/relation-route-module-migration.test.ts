import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ENTITY_ROUTES_PATH = path.resolve(__dirname, "../../src/routes/api/entity-routes.ts");

describe("relation route module migration", () => {
  it("uses relation module handlers instead of legacy entity-relations-usecase", () => {
    const source = fs.readFileSync(ENTITY_ROUTES_PATH, "utf8");

    expect(source.includes("modules/catalog/relation/application")).toBe(true);
    expect(source.includes("usecases/entity-relations-usecase")).toBe(false);
  });
});
