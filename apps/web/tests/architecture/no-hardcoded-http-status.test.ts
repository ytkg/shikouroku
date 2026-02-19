import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getSourceFiles, parseSourceFile, toSrcRelative } from "./test-utils";

const allowedFiles = new Set(["shared/config/http-status.ts"]);
const forbiddenStatusLiterals = new Set(["401", "404", "502"]);

function collectHardcodedStatusLiterals(sourceFile: ts.SourceFile): string[] {
  const literals: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isNumericLiteral(node) && forbiddenStatusLiterals.has(node.text)) {
      literals.push(node.text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return literals;
}

describe("architecture: no hardcoded http status", () => {
  it("主要HTTPステータスは shared/config/http-status.ts 経由で参照する", () => {
    const violations: string[] = [];

    for (const sourceFilePath of getSourceFiles()) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (allowedFiles.has(relativePath)) {
        continue;
      }

      const sourceFile = parseSourceFile(sourceFilePath);
      const literals = collectHardcodedStatusLiterals(sourceFile);

      for (const literal of literals) {
        violations.push(`${relativePath}: hardcoded HTTP status ${literal}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
