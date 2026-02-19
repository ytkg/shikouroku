import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  getSourceFiles,
  parseSourceFile,
  toSrcRelative
} from "./test-utils";
const allowedFiles = new Set(["shared/config/api-paths.ts", "shared/config/route-paths.ts"]);

function isForbiddenPathLiteral(value: string): boolean {
  if (value === "*") {
    return true;
  }

  if (value.startsWith("/api/")) {
    return true;
  }

  if (value.startsWith("/entities/")) {
    return true;
  }

  return value === "/login";
}

function isForbiddenTemplateSegment(value: string): boolean {
  if (value.startsWith("/api/")) {
    return true;
  }

  return value.startsWith("/entities/");
}

function collectForbiddenLiterals(sourceFile: ts.SourceFile): string[] {
  const values: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node) && isForbiddenPathLiteral(node.text)) {
      values.push(node.text);
    }

    if (ts.isNoSubstitutionTemplateLiteral(node) && isForbiddenPathLiteral(node.text)) {
      values.push(node.text);
    }

    if (ts.isTemplateExpression(node) && isForbiddenTemplateSegment(node.head.text)) {
      values.push(`template:${node.head.text}`);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

describe("architecture: no hardcoded path literals", () => {
  it("API/主要ルートはshared/config定数のみで定義される", () => {
    const sourceFiles = getSourceFiles();
    const violations: string[] = [];

    for (const sourceFilePath of sourceFiles) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (allowedFiles.has(relativePath)) {
        continue;
      }

      const sourceFile = parseSourceFile(sourceFilePath);
      const literals = collectForbiddenLiterals(sourceFile);

      for (const literal of literals) {
        violations.push(`${relativePath}: forbidden literal "${literal}"`);
      }
    }

    expect(violations).toEqual([]);
  });
});
