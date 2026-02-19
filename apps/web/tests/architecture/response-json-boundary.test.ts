import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getSourceFiles, parseSourceFile, toSrcRelative } from "./test-utils";

const allowedFiles = new Set(["shared/api/http.client.ts", "shared/api/api-error.ts"]);

function collectResponseJsonCalls(sourceFile: ts.SourceFile): number {
  let count = 0;

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "json"
    ) {
      count += 1;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return count;
}

describe("architecture: response json boundary", () => {
  it("response.json() は shared/api の境界内からのみ呼び出す", () => {
    const violations: string[] = [];

    for (const sourceFilePath of getSourceFiles()) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (allowedFiles.has(relativePath)) {
        continue;
      }

      const sourceFile = parseSourceFile(sourceFilePath);
      const callCount = collectResponseJsonCalls(sourceFile);

      if (callCount > 0) {
        violations.push(`${relativePath}: forbidden response.json() calls (${callCount})`);
      }
    }

    expect(violations).toEqual([]);
  });
});
