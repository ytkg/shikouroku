import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = path.resolve(__dirname, "../../src");
const REPOSITORIES_DIR = path.resolve(__dirname, "../../src/repositories");
const USECASES_DIR = path.resolve(__dirname, "../../src/usecases");
const LIB_DIR = path.resolve(__dirname, "../../src/lib");
const DOMAIN_DIR = path.resolve(__dirname, "../../src/domain");

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

  it("keeps usecases directory free from legacy wrappers", () => {
    const useCaseFiles = collectTsFiles(USECASES_DIR);
    expect(useCaseFiles).toEqual([]);
  });

  it("keeps lib directory free from legacy helpers", () => {
    const legacyLibFiles = collectTsFiles(LIB_DIR);
    expect(legacyLibFiles).toEqual([]);
  });

  it("keeps domain directory free from persistence records", () => {
    const legacyDomainFiles = collectTsFiles(DOMAIN_DIR);
    expect(legacyDomainFiles).toEqual([]);
  });

  it("does not import legacy usecases or repositories from source files", () => {
    const sourceFiles = collectTsFiles(SRC_DIR);
    const violations: string[] = [];

    for (const sourceFile of sourceFiles) {
      const source = fs.readFileSync(sourceFile, "utf8");
      const importsLegacyRepository = source.includes("/repositories/") || source.includes("../repositories/");
      const importsLegacyUseCase = source.includes("/usecases/") || source.includes("../usecases/");
      const importsLegacyLib = source.includes("/lib/") || source.includes("../lib/");
      const importsLegacyDomain = source.includes("/domain/") || source.includes("../domain/");

      if (importsLegacyRepository || importsLegacyUseCase || importsLegacyLib || importsLegacyDomain) {
        violations.push(path.relative(SRC_DIR, sourceFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
