import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectModuleSpecifiers,
  getSourceFiles,
  parseSourceFile,
  toSrcRelative
} from "./test-utils";

function isPageWrapperFile(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join("/");
  return /^pages\/[^/]+\/page\.tsx$/.test(normalized);
}

function isAllowedAliasImport(importPath: string): boolean {
  return importPath.startsWith("@/features/") || importPath.startsWith("@/shared/");
}

describe("architecture: pages wrapper boundaries", () => {
  it("pages/*/page.tsx は features/shared 以外へ依存しない", () => {
    const violations: string[] = [];

    for (const sourceFilePath of getSourceFiles()) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (!isPageWrapperFile(relativePath)) {
        continue;
      }

      const sourceFile = parseSourceFile(sourceFilePath);
      const imports = collectModuleSpecifiers(sourceFile);

      for (const importPath of imports) {
        if (importPath.startsWith("@/") && !isAllowedAliasImport(importPath)) {
          violations.push(`${relativePath}: forbidden alias import "${importPath}"`);
        }

        if (importPath.startsWith(".")) {
          violations.push(`${relativePath}: relative import is forbidden ("${importPath}")`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
