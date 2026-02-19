import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectExportModuleSpecifiers,
  parseSourceFile,
  srcRoot,
  toPosixPath,
  walkFiles
} from "./test-utils";

describe("architecture: widgets barrel exports", () => {
  it("widgets/index.ts は widgets/*/ui/app-*.tsx を再エクスポートする", () => {
    const widgetsRoot = path.resolve(srcRoot, "widgets");
    const widgetsIndexPath = path.resolve(widgetsRoot, "index.ts");

    const expected = walkFiles(widgetsRoot, (filePath) => {
      const relativePath = toPosixPath(path.relative(widgetsRoot, filePath));
      return /^([^/]+)\/ui\/app-[^/]+\.tsx$/.test(relativePath);
    })
      .map((filePath) => `./${toPosixPath(path.relative(widgetsRoot, filePath)).replace(/\.tsx$/, "")}`)
      .sort();

    const actual = collectExportModuleSpecifiers(parseSourceFile(widgetsIndexPath)).sort();

    expect(actual).toEqual(expected);
  });
});
