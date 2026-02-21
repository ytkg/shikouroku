import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectExportModuleSpecifiers, parseSourceFile, srcRoot } from "./test-utils";

const expectedPublicExportModules = ["./auth", "./entity"];

describe("architecture: entities root public api", () => {
  it("entities/index.ts は auth/entity の公開APIのみを再エクスポートする", () => {
    const indexPath = path.resolve(srcRoot, "entities/index.ts");
    const modules = Array.from(
      new Set(collectExportModuleSpecifiers(parseSourceFile(indexPath)))
    ).sort();

    expect(modules).toEqual(expectedPublicExportModules);
  });
});
