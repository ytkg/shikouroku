import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = path.resolve(__dirname, "../../src");
const REPOSITORIES_DIR = path.resolve(__dirname, "../../src/repositories");
const USECASES_DIR = path.resolve(__dirname, "../../src/usecases");
const RESULT_FILE = path.resolve(USECASES_DIR, "result.ts");

function collectTsFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

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

describe("legacy layer removal", () => {
  it("keeps repositories directory free from legacy wrappers", () => {
    const repositoryFiles = collectTsFiles(REPOSITORIES_DIR);
    expect(repositoryFiles).toEqual([]);
  });

  it("keeps only shared result helper under usecases", () => {
    const useCaseFiles = collectTsFiles(USECASES_DIR);
    expect(useCaseFiles).toEqual([RESULT_FILE]);
  });

  it("does not import legacy usecases or repositories from source files", () => {
    const sourceFiles = collectTsFiles(SRC_DIR);
    const violations: string[] = [];

    for (const sourceFile of sourceFiles) {
      if (sourceFile === RESULT_FILE) {
        continue;
      }

      const source = fs.readFileSync(sourceFile, "utf8");
      const importsLegacyRepository = source.includes("/repositories/") || source.includes("../repositories/");
      const importsLegacyUseCase =
        (source.includes("/usecases/") || source.includes("../usecases/")) &&
        !source.includes("/usecases/result") &&
        !source.includes("../usecases/result");

      if (importsLegacyRepository || importsLegacyUseCase) {
        violations.push(path.relative(SRC_DIR, sourceFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
