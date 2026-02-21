import { describe, expect, it } from "vitest";
import {
  collectModuleSpecifiers,
  getSourceFiles,
  parseSourceFile,
  toSrcRelative
} from "./test-utils";

const forbiddenImports = new Set(["@/entities", "@/features"]);

describe("architecture: no root slice imports", () => {
  it("src配下で @/entities と @/features のルート参照を禁止する", () => {
    const violations: string[] = [];

    for (const sourceFilePath of getSourceFiles()) {
      const relativePath = toSrcRelative(sourceFilePath);
      const sourceFile = parseSourceFile(sourceFilePath);
      const imports = collectModuleSpecifiers(sourceFile);

      for (const importPath of imports) {
        if (forbiddenImports.has(importPath)) {
          violations.push(`${relativePath}: forbidden import "${importPath}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
