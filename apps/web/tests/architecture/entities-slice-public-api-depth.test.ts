import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectExportModuleSpecifiers,
  parseSourceFile,
  srcRoot
} from "./test-utils";

function listEntitySliceIndexFiles(): string[] {
  const entitiesRoot = path.resolve(srcRoot, "entities");
  const entries = fs.readdirSync(entitiesRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(entitiesRoot, entry.name, "index.ts"))
    .filter((filePath) => fs.existsSync(filePath));
}

function isDeepRelativeExport(modulePath: string): boolean {
  return modulePath.startsWith("./") && modulePath.slice(2).includes("/");
}

describe("architecture: entities slice public api depth", () => {
  it("entities/*/index.ts で deep relative re-export を禁止する", () => {
    const violations: string[] = [];

    for (const indexPath of listEntitySliceIndexFiles()) {
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
