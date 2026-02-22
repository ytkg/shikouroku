import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = path.resolve(__dirname, "../../src");

const FILE_NAME_PATTERN = /^[a-z0-9-]+\.(ts|tsx)$/;
const DIR_NAME_PATTERN = /^[a-z0-9-]+$/;
const PROHIBITED_GENERIC_FILES = new Set(["models.ts", "schemas.ts", "utils.ts"]);

function collectFiles(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

describe("api file naming conventions", () => {
  it("uses kebab-case for directories", () => {
    const files = collectFiles(SRC_DIR);
    const directoryPaths = new Set<string>();

    for (const filePath of files) {
      const relativeDir = path.relative(SRC_DIR, path.dirname(filePath));
      if (!relativeDir || relativeDir === ".") {
        continue;
      }

      directoryPaths.add(relativeDir);
    }

    const invalidDirs = [...directoryPaths].filter((directoryPath) =>
      directoryPath.split(path.sep).some((segment) => !DIR_NAME_PATTERN.test(segment))
    );
    expect(invalidDirs).toEqual([]);
  });

  it("uses kebab-case file names", () => {
    const files = collectFiles(SRC_DIR);
    const invalidFiles = files
      .map((filePath) => path.relative(SRC_DIR, filePath))
      .filter((relativePath) => !FILE_NAME_PATTERN.test(path.basename(relativePath)));

    expect(invalidFiles).toEqual([]);
  });

  it("does not use generic file names that hide responsibilities", () => {
    const files = collectFiles(SRC_DIR);
    const genericFiles = files
      .map((filePath) => path.relative(SRC_DIR, filePath))
      .filter((relativePath) => PROHIBITED_GENERIC_FILES.has(path.basename(relativePath)));

    expect(genericFiles).toEqual([]);
  });
});
