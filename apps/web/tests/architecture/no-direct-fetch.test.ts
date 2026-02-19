import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { srcRoot, toSrcRelative, walkFiles } from "./test-utils";

const sourceFilePattern = /\.(ts|tsx)$/;
const fetchPattern = /\bfetch\s*\(/;
const allowList = new Set(["shared/api/http.client.ts"]);

describe("architecture: no direct fetch", () => {
  it("fetch() は shared/api/http.client.ts からのみ呼び出される", () => {
    const sourceFiles = walkFiles(srcRoot, (filePath) => sourceFilePattern.test(filePath));
    const violations: string[] = [];

    for (const sourceFilePath of sourceFiles) {
      const relativePath = toSrcRelative(sourceFilePath);
      if (allowList.has(relativePath)) {
        continue;
      }

      const source = fs.readFileSync(sourceFilePath, "utf-8");
      if (fetchPattern.test(source)) {
        violations.push(`${relativePath}: direct fetch() is forbidden`);
      }
    }

    expect(violations).toEqual([]);
  });
});
