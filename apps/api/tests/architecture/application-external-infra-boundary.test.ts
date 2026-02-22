import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MODULES_DIR = path.resolve(__dirname, "../../src/modules");
const IMPORT_PATTERN = /from\s+["']([^"']+)["']/g;

function collectTsFiles(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function findModuleRoot(sourceFile: string): string | null {
  const normalized = sourceFile.split(path.sep);
  const modulesIndex = normalized.lastIndexOf("modules");
  if (modulesIndex < 0 || normalized.length <= modulesIndex + 2) {
    return null;
  }

  const moduleRootParts = normalized.slice(0, modulesIndex + 3);
  return moduleRootParts.join(path.sep);
}

describe("application external infra boundary", () => {
  it("does not import infra from outside its own module root", () => {
    const sourceFiles = collectTsFiles(MODULES_DIR).filter((sourceFile) =>
      sourceFile.includes(`${path.sep}application${path.sep}`)
    );
    const violations: string[] = [];

    for (const sourceFile of sourceFiles) {
      const moduleRoot = findModuleRoot(sourceFile);
      if (!moduleRoot) {
        continue;
      }

      const source = fs.readFileSync(sourceFile, "utf8");
      const imports = [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1]);

      for (const importPath of imports) {
        if (!importPath.startsWith(".") || !importPath.includes("/infra/")) {
          continue;
        }

        const resolvedImportPath = path.resolve(path.dirname(sourceFile), importPath);
        const normalizedResolved = path.normalize(resolvedImportPath);
        const normalizedModuleRoot = path.normalize(moduleRoot);
        if (!normalizedResolved.startsWith(normalizedModuleRoot)) {
          const sourceRelativePath = path.relative(MODULES_DIR, sourceFile);
          violations.push(`${sourceRelativePath} -> ${importPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
