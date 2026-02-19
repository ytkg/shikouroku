import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getSourceFiles, parseSourceFile, toSrcRelative } from "./test-utils";

function collectExportStarViolations(sourceFile: ts.SourceFile): string[] {
  const violations: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isExportDeclaration(node) && !node.exportClause) {
      violations.push("export * is forbidden");
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

describe("architecture: no export star", () => {
  it("src配下で export * を使用しない", () => {
    const violations: string[] = [];

    for (const sourceFilePath of getSourceFiles()) {
      const sourceFile = parseSourceFile(sourceFilePath);
      const exportStarViolations = collectExportStarViolations(sourceFile);
      const relativePath = toSrcRelative(sourceFilePath);

      for (const violation of exportStarViolations) {
        violations.push(`${relativePath}: ${violation}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
