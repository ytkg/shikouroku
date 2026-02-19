import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { parseSourceFile, srcRoot, walkFiles } from "./test-utils";

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function collectExportSpecifiers(sourceFile: ts.SourceFile): string[] {
  const specifiers: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

describe("architecture: widgets barrel exports", () => {
  it("widgets/index.ts は widgets/*/ui/app-*.tsx を再エクスポートする", () => {
    const widgetsRoot = path.resolve(srcRoot, "widgets");
    const widgetsIndexPath = path.resolve(widgetsRoot, "index.ts");

    const expected = walkFiles(widgetsRoot, (filePath) => {
      const relativePath = toPosixPath(path.relative(widgetsRoot, filePath));
      return /^([^/]+)\/ui\/app-[^/]+\.tsx$/.test(relativePath);
    })
      .map((filePath) => `./${toPosixPath(path.relative(widgetsRoot, filePath)).replace(/\.tsx$/, "")}`)
      .sort();

    const actual = collectExportSpecifiers(parseSourceFile(widgetsIndexPath)).sort();

    expect(actual).toEqual(expected);
  });
});
