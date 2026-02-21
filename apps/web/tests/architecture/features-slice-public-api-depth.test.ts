import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectExportModuleSpecifiers,
  parseSourceFile,
  srcRoot
} from "./test-utils";

function listFeatureSliceIndexFiles(): string[] {
  const featuresRoot = path.resolve(srcRoot, "features");
  const entries = fs.readdirSync(featuresRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(featuresRoot, entry.name, "index.ts"))
    .filter((filePath) => fs.existsSync(filePath));
}

function isDeepRelativeExport(modulePath: string): boolean {
  return modulePath.startsWith("./") && modulePath.slice(2).includes("/");
}

describe("architecture: features slice public api depth", () => {
  it("features/*/index.ts で deep relative re-export を禁止する", () => {
    const violations: string[] = [];

    for (const indexPath of listFeatureSliceIndexFiles()) {
      const modules = collectExportModuleSpecifiers(parseSourceFile(indexPath));
      const relativeIndexPath = path.relative(srcRoot, indexPath);

      for (const modulePath of modules) {
        if (isDeepRelativeExport(modulePath)) {
          violations.push(`${relativeIndexPath}: forbidden deep export "${modulePath}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
