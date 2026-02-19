import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  getSourceFiles,
  parseSourceFile,
  toSrcRelative
} from "./test-utils";
const allowList = new Set(["shared/api/http.client.ts"]);

function hasFetchCall(sourceFile: ts.SourceFile): boolean {
  let found = false;

  function visit(node: ts.Node) {
    if (found) {
      return;
    }

    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && node.expression.text === "fetch") {
        found = true;
        return;
      }

      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "fetch") {
        found = true;
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

describe("architecture: no direct fetch", () => {
  it("fetch() は shared/api/http.client.ts からのみ呼び出される", () => {
    const sourceFiles = getSourceFiles();
    const violations: string[] = [];

    for (const sourceFilePath of sourceFiles) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (allowList.has(relativePath)) {
        continue;
      }

      const sourceFile = parseSourceFile(sourceFilePath);
      if (hasFetchCall(sourceFile)) {
        violations.push(`${relativePath}: direct fetch() is forbidden`);
      }
    }

    expect(violations).toEqual([]);
  });
});
