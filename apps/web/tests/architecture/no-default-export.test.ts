import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getSourceFiles, parseSourceFile, toSrcRelative } from "./test-utils";

function hasDefaultModifier(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  return modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) ?? false;
}

function collectDefaultExportViolations(sourceFile: ts.SourceFile): string[] {
  const violations: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isExportAssignment(node)) {
      violations.push("export assignment");
    }

    if (hasDefaultModifier(node)) {
      violations.push("default modifier export");
    }

    if (ts.isExportSpecifier(node) && node.name.text === "default") {
      violations.push("export specifier as default");
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

describe("architecture: no default export", () => {
  it("src配下で default export を使用しない", () => {
    const violations: string[] = [];

    for (const sourceFilePath of getSourceFiles()) {
      const sourceFile = parseSourceFile(sourceFilePath);
      const defaultExports = collectDefaultExportViolations(sourceFile);
      const relativePath = toSrcRelative(sourceFilePath);

      for (const violation of defaultExports) {
        violations.push(`${relativePath}: ${violation}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
