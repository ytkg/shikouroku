import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const KIND_ROUTES_PATH = path.resolve(__dirname, "../../src/routes/api/kind-routes.ts");

describe("kind route module migration", () => {
  it("uses module query instead of legacy kinds-usecase", () => {
    const source = fs.readFileSync(KIND_ROUTES_PATH, "utf8");

    expect(source.includes("modules/catalog/kind/application")).toBe(true);
    expect(source.includes("usecases/kinds-usecase")).toBe(false);
  });
});
