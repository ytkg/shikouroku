import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(currentDir, "../../src");

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const targetPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(targetPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(targetPath);
    }
  }

  return files;
}

function isDomainApiClient(filePath: string): boolean {
  const relativePath = path.relative(srcRoot, filePath);
  if (!relativePath.endsWith(".client.ts")) {
    return false;
  }

  if (!relativePath.includes(`${path.sep}api${path.sep}`)) {
    return false;
  }

  return relativePath.startsWith(`entities${path.sep}`) || relativePath.startsWith(`features${path.sep}`);
}

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
    const clientFiles = walkFiles(srcRoot).filter(isDomainApiClient);
    expect(clientFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const filePath of clientFiles) {
      const sourceText = fs.readFileSync(filePath, "utf-8");
      const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
      const baseName = path.basename(filePath, ".client.ts");
      const expectedImportPath = `./${baseName}.response`;
      const relativePath = path.relative(srcRoot, filePath);

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
