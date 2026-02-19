import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectExportModuleSpecifiers, parseSourceFile, srcRoot } from "./test-utils";

const expectedPublicExportModules = ["./login", "./model", "@/entities/auth"];

describe("architecture: features auth public api", () => {
  it("features/auth/index.ts は認可済み公開モジュールのみを再エクスポートする", () => {
    const indexPath = path.resolve(srcRoot, "features/auth/index.ts");
    const modules = Array.from(
      new Set(collectExportModuleSpecifiers(parseSourceFile(indexPath)))
    ).sort();

    expect(modules).toEqual(expectedPublicExportModules);
  });
});
