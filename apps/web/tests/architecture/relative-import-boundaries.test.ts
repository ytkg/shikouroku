import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(currentDir, "../../src");
const sourceFilePattern = /\.(ts|tsx)$/;
const allowedLayers = new Set(["app", "pages", "widgets", "features", "entities", "shared"]);

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const targetPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(targetPath));
      continue;
    }

    if (entry.isFile() && sourceFilePattern.test(entry.name)) {
      files.push(targetPath);
    }
  }

  return files;
}

function extractImportPaths(source: string): string[] {
  const fromImportMatches = source.matchAll(/from\s+["']([^"']+)["']/g);
  return Array.from(fromImportMatches, (match) => match[1]);
}

function resolveRelativeImport(sourceFilePath: string, importPath: string): string | null {
  const basePath = path.resolve(path.dirname(sourceFilePath), importPath);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function topLayer(absoluteFilePath: string): string | null {
  const relativePath = path.relative(srcRoot, absoluteFilePath);
  const [layer] = relativePath.split(path.sep);
  if (!layer || layer.startsWith("..")) {
    return null;
  }
  if (!allowedLayers.has(layer)) {
    return null;
  }
  return layer;
}

describe("architecture: relative import boundaries", () => {
  it("相対importでトップレイヤをまたがない", () => {
    const sourceFiles = walkFiles(srcRoot);
    const violations: string[] = [];

    for (const sourceFilePath of sourceFiles) {
      const sourceLayer = topLayer(sourceFilePath);
      if (!sourceLayer) {
        continue;
      }

      const sourceText = fs.readFileSync(sourceFilePath, "utf-8");
      const importPaths = extractImportPaths(sourceText);

      for (const importPath of importPaths) {
        if (!importPath.startsWith(".")) {
          continue;
        }

        const resolvedPath = resolveRelativeImport(sourceFilePath, importPath);
        if (!resolvedPath) {
          continue;
        }

        const targetLayer = topLayer(resolvedPath);
        if (!targetLayer) {
          continue;
        }

        if (sourceLayer !== targetLayer) {
          violations.push(
            `${path.relative(srcRoot, sourceFilePath)} -> ${importPath}: cross-layer relative import to ${targetLayer}`
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
