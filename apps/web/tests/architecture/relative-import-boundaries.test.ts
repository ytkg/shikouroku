import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  srcRoot,
  toSrcRelative,
  topLayerFromAbsolute,
  walkFiles
} from "./test-utils";
const sourceFilePattern = /\.(ts|tsx)$/;

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

describe("architecture: relative import boundaries", () => {
  it("相対importでトップレイヤをまたがない", () => {
    const sourceFiles = walkFiles(srcRoot, (filePath) => sourceFilePattern.test(filePath));
    const violations: string[] = [];

    for (const sourceFilePath of sourceFiles) {
      const sourceLayer = topLayerFromAbsolute(sourceFilePath);
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

        const targetLayer = topLayerFromAbsolute(resolvedPath);
        if (!targetLayer) {
          continue;
        }

        if (sourceLayer !== targetLayer) {
          violations.push(
            `${toSrcRelative(sourceFilePath)} -> ${importPath}: cross-layer relative import to ${targetLayer}`
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
