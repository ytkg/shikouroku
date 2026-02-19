import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getSourceFiles, parseSourceFile, toSrcRelative } from "./test-utils";

const allowedFiles = new Set(["shared/lib/url.ts"]);
const targetFunctions = new Set(["encodeURIComponent", "decodeURIComponent"]);

function collectEncodingCalls(sourceFile: ts.SourceFile): string[] {
  const calls: string[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      targetFunctions.has(node.expression.text)
    ) {
      calls.push(node.expression.text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return calls;
}

describe("architecture: no direct uri component encoding", () => {
  it("encode/decodeURIComponent は shared/lib/url.ts からのみ呼び出す", () => {
    const violations: string[] = [];

    for (const sourceFilePath of getSourceFiles()) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (allowedFiles.has(relativePath)) {
        continue;
      }

      const sourceFile = parseSourceFile(sourceFilePath);
      const calls = collectEncodingCalls(sourceFile);

      for (const call of calls) {
        violations.push(`${relativePath}: forbidden ${call}() call`);
      }
    }

    expect(violations).toEqual([]);
  });
});
