import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const RELATION_APPLICATION_DIR = path.resolve(__dirname, "../../src/modules/catalog/relation/application");

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

describe("relation application boundary", () => {
  it("does not import infra layer directly", () => {
    const applicationFiles = collectTsFiles(RELATION_APPLICATION_DIR);
    const violations: string[] = [];

    for (const applicationFile of applicationFiles) {
      const source = fs.readFileSync(applicationFile, "utf8");
      if (source.includes("/infra/") || source.includes("../infra/")) {
        violations.push(path.relative(RELATION_APPLICATION_DIR, applicationFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
