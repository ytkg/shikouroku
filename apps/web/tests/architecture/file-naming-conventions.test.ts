import path from "node:path";
import { describe, expect, it } from "vitest";
import { getSourceFiles, toSrcRelative } from "./test-utils";

const allowedFileNamePattern = /^(?:index|main|page|[a-z0-9]+(?:[.-][a-z0-9]+)*)\.(?:ts|tsx)$/;
const allowedDirectoryNamePattern = /^[a-z0-9-]+$/;

function collectViolations(sourceFilePath: string): string[] {
  const relativePath = toSrcRelative(sourceFilePath);
  const fileName = path.basename(relativePath);
  const directories = path
    .dirname(relativePath)
    .split(path.sep)
    .filter((name) => name.length > 0 && name !== ".");
  const violations: string[] = [];

  if (!allowedFileNamePattern.test(fileName)) {
    violations.push(`${relativePath}: invalid file name "${fileName}"`);
  }

  if (fileName.endsWith("-types.ts")) {
    violations.push(`${relativePath}: use ".types.ts" suffix instead of "-types.ts"`);
  }

  for (const directoryName of directories) {
    if (!allowedDirectoryNamePattern.test(directoryName)) {
      violations.push(`${relativePath}: invalid directory name "${directoryName}"`);
    }
  }

  return violations;
}

describe("architecture: file naming conventions", () => {
  it("src配下のファイル/ディレクトリ名は命名規約に従う", () => {
    const violations = getSourceFiles().flatMap(collectViolations);
    expect(violations).toEqual([]);
  });
});
