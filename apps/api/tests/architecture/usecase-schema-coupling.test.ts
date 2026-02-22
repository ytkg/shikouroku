import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const USECASES_DIR = path.resolve(__dirname, "../../src/usecases");
const FORBIDDEN_IMPORT = "../domain/schemas";

function collectUsecaseFiles(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectUsecaseFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("usecase-schema coupling", () => {
  it("does not import domain/schemas from usecases", () => {
    const usecaseFiles = collectUsecaseFiles(USECASES_DIR);
    const violations: string[] = [];

    for (const usecaseFile of usecaseFiles) {
      const source = fs.readFileSync(usecaseFile, "utf8");
      if (source.includes(FORBIDDEN_IMPORT)) {
        violations.push(path.relative(USECASES_DIR, usecaseFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
