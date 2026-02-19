import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(currentDir, "../../src");

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const targetPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(targetPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(targetPath);
    }
  }

  return files;
}

function isDomainApiClient(filePath: string): boolean {
  const relativePath = path.relative(srcRoot, filePath);
  if (!relativePath.endsWith(".client.ts")) {
    return false;
  }

  if (!relativePath.includes(`${path.sep}api${path.sep}`)) {
    return false;
  }

  return relativePath.startsWith(`entities${path.sep}`) || relativePath.startsWith(`features${path.sep}`);
}

describe("architecture: api parser usage", () => {
  it("api配下の*.client.tsは対応*.response.tsをimportし、parse関数を利用する", () => {
    const clientFiles = walkFiles(srcRoot).filter(isDomainApiClient);
    expect(clientFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const filePath of clientFiles) {
      const source = fs.readFileSync(filePath, "utf-8");
      const baseName = path.basename(filePath, ".client.ts");
      const expectedImportPath = `./${baseName}.response`;

      if (!source.includes(expectedImportPath)) {
        violations.push(`${path.relative(srcRoot, filePath)}: missing import "${expectedImportPath}"`);
        continue;
      }

      if (!/parse[A-Z]\w*\(/.test(source)) {
        violations.push(`${path.relative(srcRoot, filePath)}: missing parser call`);
      }
    }

    expect(violations).toEqual([]);
  });
});
