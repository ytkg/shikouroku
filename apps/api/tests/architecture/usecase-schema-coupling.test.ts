import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MODULES_DIR = path.resolve(__dirname, "../../src/modules");
const FORBIDDEN_IMPORT = "domain/schemas";

function collectFiles(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("application-schema coupling", () => {
  it("does not import domain/schemas from module application layer", () => {
    const applicationFiles = collectFiles(MODULES_DIR).filter((filePath) =>
      filePath.includes(`${path.sep}application${path.sep}`)
    );
    const violations: string[] = [];

    for (const applicationFile of applicationFiles) {
      const source = fs.readFileSync(applicationFile, "utf8");
      if (source.includes(FORBIDDEN_IMPORT)) {
        violations.push(path.relative(MODULES_DIR, applicationFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
