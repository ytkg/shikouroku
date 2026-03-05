import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MAINTENANCE_APPLICATION_DIR = path.resolve(
  __dirname,
  "../../src/modules/maintenance/image-cleanup/application"
);
const MAINTENANCE_PORT_FILE = path.resolve(
  __dirname,
  "../../src/modules/maintenance/image-cleanup/ports/image-cleanup-task-repository.ts"
);
const CLEANUP_MUTATION_PORT_METHODS = ["deleteTask", "markTaskFailed"] as const;
const CLEANUP_ENQUEUE_PORT_METHOD = "enqueueTask";

function collectTsFiles(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractPromiseReturnType(source: string, methodName: string): string | null {
  const methodPattern = new RegExp(`${methodName}:\\s*\\([^)]*\\)\\s*=>\\s*Promise<([\\s\\S]*?)>;`, "m");
  const match = source.match(methodPattern);
  if (!match) {
    return null;
  }

  return normalizeSpace(match[1]);
}

function isExplicitUnionType(source: string, returnType: string): boolean {
  if (returnType.includes("|")) {
    return true;
  }

  const typeAliasPattern = new RegExp(`type\\s+${escapeRegExp(returnType)}\\s*=([\\s\\S]*?);`, "m");
  const typeAliasMatch = source.match(typeAliasPattern);
  if (!typeAliasMatch) {
    return false;
  }

  return typeAliasMatch[1].includes("|");
}

describe("maintenance application boundary", () => {
  it("does not import infra layer directly", () => {
    const applicationFiles = collectTsFiles(MAINTENANCE_APPLICATION_DIR);
    const violations: string[] = [];

    for (const applicationFile of applicationFiles) {
      const source = fs.readFileSync(applicationFile, "utf8");
      if (source.includes("/infra/") || source.includes("../infra/")) {
        violations.push(path.relative(MAINTENANCE_APPLICATION_DIR, applicationFile));
      }
    }

    expect(violations).toEqual([]);
  });

  it("uses explicit union return types for cleanup ports without boolean dependency", () => {
    const source = fs.readFileSync(MAINTENANCE_PORT_FILE, "utf8");
    const returnTypes = CLEANUP_MUTATION_PORT_METHODS.map((methodName) => ({
      methodName,
      returnType: extractPromiseReturnType(source, methodName)
    }));
    const enqueueReturnType = extractPromiseReturnType(source, CLEANUP_ENQUEUE_PORT_METHOD);
    const missingMethods = returnTypes
      .filter(({ returnType }) => returnType === null)
      .map(({ methodName }) => methodName)
      .concat(enqueueReturnType === null ? [CLEANUP_ENQUEUE_PORT_METHOD] : []);

    expect(missingMethods).toEqual([]);

    const mutationReturnTypes = returnTypes.map(({ returnType }) => returnType ?? "");
    const uniqueReturnTypes = [...new Set(mutationReturnTypes)];
    expect(uniqueReturnTypes).toHaveLength(1);
    expect(isExplicitUnionType(source, uniqueReturnTypes[0])).toBe(true);
    expect(uniqueReturnTypes[0]).not.toBe("boolean");
    expect(isExplicitUnionType(source, enqueueReturnType ?? "")).toBe(true);
    expect(enqueueReturnType).not.toBe("boolean");
  });
});
