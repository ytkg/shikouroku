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

function toRelative(filePath: string): string {
  return path.relative(srcRoot, filePath);
}

function isDomainApiClient(relativePath: string): boolean {
  if (!relativePath.endsWith(".client.ts")) {
    return false;
  }

  if (!relativePath.includes(`${path.sep}api${path.sep}`)) {
    return false;
  }

  return relativePath.startsWith(`entities${path.sep}`) || relativePath.startsWith(`features${path.sep}`);
}

describe("architecture: api client/response pairing", () => {
  it("api配下の*.client.tsは対応する*.response.tsを持つ", () => {
    const allFiles = walkFiles(srcRoot).map(toRelative);
    const clientFiles = allFiles.filter(isDomainApiClient);

    expect(clientFiles.length).toBeGreaterThan(0);

    const missingPairs = clientFiles.filter((clientPath) => {
      const responsePath = clientPath.replace(".client.ts", ".response.ts");
      return !allFiles.includes(responsePath);
    });

    expect(missingPairs).toEqual([]);
  });
});
