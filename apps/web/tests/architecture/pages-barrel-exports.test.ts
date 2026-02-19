import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectExportModuleSpecifiers,
  parseSourceFile,
  srcRoot,
  toPosixPath,
  walkFiles
} from "./test-utils";

describe("architecture: pages barrel exports", () => {
  it("pages/index.ts は pages/*/page.tsx をすべて再エクスポートする", () => {
    const pagesRoot = path.resolve(srcRoot, "pages");
    const pagesIndexPath = path.resolve(pagesRoot, "index.ts");

    const expected = walkFiles(pagesRoot, (filePath) => filePath.endsWith(`${path.sep}page.tsx`))
      .map((filePath) => `./${toPosixPath(path.relative(pagesRoot, filePath)).replace(/\.tsx$/, "")}`)
      .sort();

    const actual = collectExportModuleSpecifiers(parseSourceFile(pagesIndexPath)).sort();

    expect(actual).toEqual(expected);
  });
});
