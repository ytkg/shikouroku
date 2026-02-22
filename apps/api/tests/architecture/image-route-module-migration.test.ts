import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ENTITY_ROUTES_PATH = path.resolve(__dirname, "../../src/routes/api/entity-routes.ts");

describe("image route module migration", () => {
  it("uses image module handlers instead of legacy entity-images-usecase", () => {
    const source = fs.readFileSync(ENTITY_ROUTES_PATH, "utf8");

    expect(source.includes("modules/catalog/image/application")).toBe(true);
    expect(source.includes("usecases/entity-images-usecase")).toBe(false);
  });
});
