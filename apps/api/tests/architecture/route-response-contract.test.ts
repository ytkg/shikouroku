import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROUTES_DIR = path.resolve(__dirname, "../../src/routes");

function collectRouteFiles(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("route response contract", () => {
  it("does not call c.json directly in routes", () => {
    const routeFiles = collectRouteFiles(ROUTES_DIR);
    const violations: string[] = [];

    for (const routeFile of routeFiles) {
      const source = fs.readFileSync(routeFile, "utf8");
      if (source.includes("c.json(")) {
        violations.push(path.relative(ROUTES_DIR, routeFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
