import fs from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { srcRoot, toSrcRelative, walkFiles } from "./test-utils";

const sourceFilePattern = /\.(ts|tsx)$/;
const allowedFiles = new Set(["shared/config/api-paths.ts", "shared/config/route-paths.ts"]);

function isForbiddenPathLiteral(value: string): boolean {
  if (value.startsWith("/api/")) {
    return true;
  }

  return value === "/login" || value === "/entities/new";
}

function collectForbiddenLiterals(sourceFile: ts.SourceFile): string[] {
  const values: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node) && isForbiddenPathLiteral(node.text)) {
      values.push(node.text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

describe("architecture: no hardcoded path literals", () => {
  it("API/主要ルートはshared/config定数のみで定義される", () => {
    const sourceFiles = walkFiles(srcRoot, (filePath) => sourceFilePattern.test(filePath));
    const violations: string[] = [];

    for (const sourceFilePath of sourceFiles) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (allowedFiles.has(relativePath)) {
        continue;
      }

      const source = fs.readFileSync(sourceFilePath, "utf-8");
      const sourceFile = ts.createSourceFile(sourceFilePath, source, ts.ScriptTarget.Latest, true);
      const literals = collectForbiddenLiterals(sourceFile);

      for (const literal of literals) {
        violations.push(`${relativePath}: forbidden literal "${literal}"`);
      }
    }

    expect(violations).toEqual([]);
  });
});
