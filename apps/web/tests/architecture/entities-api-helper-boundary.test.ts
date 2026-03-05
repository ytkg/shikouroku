import { describe, expect, it } from "vitest";
import {
  collectModuleSpecifiers,
  getSourceFiles,
  parseSourceFile,
  toSrcRelative,
  toPosixPath
} from "./test-utils";

const INTERNAL_HELPER_IMPORTS = new Set([
  "@/entities/entity/api/entities-client-helpers",
  "@/entities/entity/api/entity-mutation-request"
]);

function isAllowedImporter(relativePath: string): boolean {
  return relativePath.startsWith("entities/entity/api/") && relativePath.endsWith(".client.ts");
}

describe("architecture: entities api helper boundary", () => {
  it("entities api 内部ヘルパーは entities/entity/api/*.client.ts からのみ参照される", () => {
    const files = getSourceFiles();
    const violations: string[] = [];

    for (const filePath of files) {
      const relativePath = toPosixPath(toSrcRelative(filePath));
      const sourceFile = parseSourceFile(filePath);
      const imports = collectModuleSpecifiers(sourceFile);

      for (const importPath of imports) {
        if (!INTERNAL_HELPER_IMPORTS.has(importPath)) {
          continue;
        }

        if (!isAllowedImporter(relativePath)) {
          violations.push(`${relativePath}: forbidden internal helper import (${importPath})`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
