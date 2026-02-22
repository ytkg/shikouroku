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

describe("route-usecase boundary", () => {
  it("does not import repositories directly from routes", () => {
    const routeFiles = collectRouteFiles(ROUTES_DIR);
    const violations: string[] = [];

    for (const routeFile of routeFiles) {
      const source = fs.readFileSync(routeFile, "utf8");
      if (source.includes("/repositories/") || source.includes("../repositories/")) {
        violations.push(path.relative(ROUTES_DIR, routeFile));
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not import legacy usecases directly from routes", () => {
    const routeFiles = collectRouteFiles(ROUTES_DIR);
    const violations: string[] = [];

    for (const routeFile of routeFiles) {
      const source = fs.readFileSync(routeFile, "utf8");
      if (source.includes("/usecases/") || source.includes("../usecases/")) {
        violations.push(path.relative(ROUTES_DIR, routeFile));
      }
    }

    expect(violations).toEqual([]);
  });
});
