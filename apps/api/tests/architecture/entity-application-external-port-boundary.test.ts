import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ENTITY_APPLICATION_DIR = path.resolve(__dirname, "../../src/modules/catalog/entity/application");
const PROHIBITED_IMPORT_SEGMENTS = ["/kind/infra/", "../kind/infra/", "/tag/infra/", "../tag/infra/"];

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

describe("entity application external boundary", () => {
  it("does not import kind/tag infra layer directly", () => {
    const applicationFiles = collectTsFiles(ENTITY_APPLICATION_DIR);
    const violations: string[] = [];

    for (const applicationFile of applicationFiles) {
      const source = fs.readFileSync(applicationFile, "utf8");
      if (PROHIBITED_IMPORT_SEGMENTS.some((segment) => source.includes(segment))) {
        violations.push(path.relative(ENTITY_APPLICATION_DIR, applicationFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
