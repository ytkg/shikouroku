import fs from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { srcRoot, toSrcRelative, walkFiles } from "./test-utils";

const sourceFilePattern = /\.(ts|tsx)$/;
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
    const sourceFiles = walkFiles(srcRoot, (filePath) => sourceFilePattern.test(filePath));
    const violations: string[] = [];

    for (const sourceFilePath of sourceFiles) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (allowList.has(relativePath)) {
        continue;
      }

      const source = fs.readFileSync(sourceFilePath, "utf-8");
      const sourceFile = ts.createSourceFile(sourceFilePath, source, ts.ScriptTarget.Latest, true);
      if (hasFetchCall(sourceFile)) {
        violations.push(`${relativePath}: direct fetch() is forbidden`);
      }
    }

    expect(violations).toEqual([]);
  });
});
