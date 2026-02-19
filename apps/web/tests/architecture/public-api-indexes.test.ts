import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { srcRoot } from "./test-utils";

function listSliceDirectories(baseDir: string): string[] {
  const dirPath = path.join(srcRoot, baseDir);
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dirPath, entry.name));
}

describe("architecture: public api indexes", () => {
  it("features/* と entities/* の各スライス直下に index.ts が存在する", () => {
    const sliceDirs = [
      ...listSliceDirectories("features"),
      ...listSliceDirectories("entities")
    ];

    const missingIndexes = sliceDirs
      .filter((sliceDir) => !fs.existsSync(path.join(sliceDir, "index.ts")))
      .map((sliceDir) => path.relative(srcRoot, sliceDir));

    expect(missingIndexes).toEqual([]);
  });

  it("主要レイヤのルート public api index.ts が存在する", () => {
    const requiredIndexes = ["entities/index.ts", "pages/index.ts", "widgets/index.ts"];

    const missingIndexes = requiredIndexes.filter(
      (relativePath) => !fs.existsSync(path.join(srcRoot, relativePath))
    );

    expect(missingIndexes).toEqual([]);
  });
});
