import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectExportModuleSpecifiers, parseSourceFile, srcRoot } from "./test-utils";

const expectedPublicExports = ["./create", "./detail", "./edit", "./list", "./manage-tags", "./map"];

describe("architecture: features entities public api", () => {
  it("features/entities/index.ts はサブ機能の公開indexのみを再エクスポートする", () => {
    const indexPath = path.resolve(srcRoot, "features/entities/index.ts");
    const exports = collectExportModuleSpecifiers(parseSourceFile(indexPath)).sort();

    expect(exports).toEqual(expectedPublicExports);
  });
});
