import fs from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { srcRoot, toSrcRelative, walkFiles } from "./test-utils";

const sourceFilePattern = /\.(ts|tsx)$/;

function isAllowedRequestJsonCaller(relativePath: string): boolean {
  if (relativePath === "shared/api/http.client.ts") {
    return true;
  }

  return /^entities\/[^/]+\/api\/.+\.client\.ts$/.test(relativePath);
}

function collectRequestJsonIdentifiers(
  sourceFile: ts.SourceFile
): { localName: string; modulePath: string }[] {
  const identifiers: { localName: string; modulePath: string }[] = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const modulePath = statement.moduleSpecifier.text;
    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      continue;
    }

    for (const element of namedBindings.elements) {
      const importedName = (element.propertyName ?? element.name).text;
      if (importedName === "requestJson") {
        identifiers.push({ localName: element.name.text, modulePath });
      }
    }
  }

  return identifiers;
}

function hasIdentifierCall(sourceFile: ts.SourceFile, identifierName: string): boolean {
  let found = false;

  function visit(node: ts.Node) {
    if (found) {
      return;
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === identifierName) {
        found = true;
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

describe("architecture: requestJson boundary", () => {
  it("requestJson は entities/*/api/*.client.ts からのみ呼び出される", () => {
    const sourceFiles = walkFiles(srcRoot, (filePath) => sourceFilePattern.test(filePath));
    const violations: string[] = [];

    for (const sourceFilePath of sourceFiles) {
      const relativePath = toSrcRelative(sourceFilePath);
      const source = fs.readFileSync(sourceFilePath, "utf-8");
      const sourceFile = ts.createSourceFile(sourceFilePath, source, ts.ScriptTarget.Latest, true);
      const importedIdentifiers = collectRequestJsonIdentifiers(sourceFile);

      for (const imported of importedIdentifiers) {
        if (imported.modulePath !== "@/shared/api/http.client" && imported.modulePath !== "./http.client") {
          continue;
        }

        if (isAllowedRequestJsonCaller(relativePath)) {
          continue;
        }

        if (hasIdentifierCall(sourceFile, imported.localName)) {
          violations.push(`${relativePath}: requestJson call is forbidden in this layer`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
