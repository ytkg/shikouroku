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

describe("architecture: pages barrel exports", () => {
  it("pages/index.ts は pages/*/page.tsx をすべて再エクスポートする", () => {
    const pagesRoot = path.resolve(srcRoot, "pages");
    const pagesIndexPath = path.resolve(pagesRoot, "index.ts");

    const expected = walkFiles(pagesRoot, (filePath) => filePath.endsWith(`${path.sep}page.tsx`))
      .map((filePath) => `./${toPosixPath(path.relative(pagesRoot, filePath)).replace(/\.tsx$/, "")}`)
      .sort();

    const actual = collectExportSpecifiers(parseSourceFile(pagesIndexPath)).sort();

    expect(actual).toEqual(expected);
  });
});
