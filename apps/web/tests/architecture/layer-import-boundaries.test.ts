import { describe, expect, it } from "vitest";
import { getSourceFiles, readSourceText, toSrcRelative } from "./test-utils";

function extractAliasImports(source: string): string[] {
  const importMatches = source.matchAll(/from\s+["'](@\/[^"']+)["']/g);
  return Array.from(importMatches, (match) => match[1]);
}

function startsWithAny(value: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => value.startsWith(prefix));
}

function isDeepSliceImport(value: string, slice: "features" | "entities"): boolean {
  return new RegExp(`^@\\/${slice}\\/[^/]+\\/.+`).test(value);
}

describe("architecture: layer import boundaries", () => {
  it("各レイヤが禁止レイヤへ依存していない", () => {
    const files = getSourceFiles();
    const violations: string[] = [];

    for (const filePath of files) {
      const relativePath = toSrcRelative(filePath);
      const source = readSourceText(filePath);
      const imports = extractAliasImports(source);

      for (const importPath of imports) {
        if (relativePath.startsWith("shared/")) {
          if (
            startsWithAny(importPath, [
              "@/app",
              "@/pages",
              "@/widgets",
              "@/features",
              "@/entities"
            ])
          ) {
            violations.push(`${relativePath}: shared cannot import ${importPath}`);
          }
          continue;
        }

        if (relativePath.startsWith("entities/")) {
          if (
            startsWithAny(importPath, [
              "@/app",
              "@/pages",
              "@/widgets",
              "@/features"
            ])
          ) {
            violations.push(`${relativePath}: entities cannot import ${importPath}`);
          }
          if (isDeepSliceImport(importPath, "entities")) {
            violations.push(`${relativePath}: entities deep import is forbidden (${importPath})`);
          }
          continue;
        }

        if (relativePath.startsWith("features/")) {
          if (startsWithAny(importPath, ["@/app", "@/pages", "@/widgets"])) {
            violations.push(`${relativePath}: features cannot import ${importPath}`);
          }
          if (isDeepSliceImport(importPath, "features")) {
            violations.push(`${relativePath}: features deep import is forbidden (${importPath})`);
          }
          if (isDeepSliceImport(importPath, "entities")) {
            violations.push(
              `${relativePath}: features should use entities public api instead of ${importPath}`
            );
          }
          continue;
        }

        if (
          relativePath.startsWith("app/") ||
          relativePath.startsWith("pages/") ||
          relativePath.startsWith("widgets/")
        ) {
          if (isDeepSliceImport(importPath, "features")) {
            violations.push(`${relativePath}: app/pages/widgets deep feature import (${importPath})`);
          }
          if (isDeepSliceImport(importPath, "entities")) {
            violations.push(`${relativePath}: app/pages/widgets deep entity import (${importPath})`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
