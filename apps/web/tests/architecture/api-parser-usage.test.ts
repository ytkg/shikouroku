import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  getSourceFiles,
  isDomainApiClientRelative,
  parseSourceFile,
  toSrcRelative,
} from "./test-utils";

function getImportedParserIdentifiers(sourceFile: ts.SourceFile, expectedImportPath: string): Set<string> {
  const parserIdentifiers = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    if (statement.moduleSpecifier.text !== expectedImportPath) {
      continue;
    }

    const importClause = statement.importClause;
    const namedBindings = importClause?.namedBindings;

    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      continue;
    }

    for (const element of namedBindings.elements) {
      const identifier = (element.propertyName ?? element.name).text;
      if (identifier.startsWith("parse")) {
        parserIdentifiers.add(element.name.text);
      }
    }
  }

  return parserIdentifiers;
}

function hasParserCall(sourceFile: ts.SourceFile, parserIdentifiers: Set<string>): boolean {
  if (parserIdentifiers.size === 0) {
    return false;
  }

  let found = false;

  function visit(node: ts.Node) {
    if (found) {
      return;
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (parserIdentifiers.has(node.expression.text)) {
        found = true;
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

describe("architecture: api parser usage", () => {
  it("api配下の*.client.tsは対応*.response.tsからimportしたparse関数を呼び出す", () => {
    const clientFiles = getSourceFiles().filter((filePath) =>
      isDomainApiClientRelative(toSrcRelative(filePath))
    );
    expect(clientFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const filePath of clientFiles) {
      const sourceFile = parseSourceFile(filePath);
      const baseName = path.basename(filePath, ".client.ts");
      const expectedImportPath = `./${baseName}.response`;
      const relativePath = toSrcRelative(filePath);

      const parserIdentifiers = getImportedParserIdentifiers(sourceFile, expectedImportPath);
      if (parserIdentifiers.size === 0) {
        violations.push(`${relativePath}: missing parser import from "${expectedImportPath}"`);
        continue;
      }

      if (!hasParserCall(sourceFile, parserIdentifiers)) {
        violations.push(`${relativePath}: parser function call not found`);
      }
    }

    expect(violations).toEqual([]);
  });
});
