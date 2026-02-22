import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const TAG_ROUTES_PATH = path.resolve(__dirname, "../../src/routes/api/tag-routes.ts");

describe("tag route module migration", () => {
  it("uses module application handlers instead of legacy tags-usecase", () => {
    const source = fs.readFileSync(TAG_ROUTES_PATH, "utf8");

    expect(source.includes("modules/catalog/tag/application")).toBe(true);
    expect(source.includes("usecases/tags-usecase")).toBe(false);
  });
});
