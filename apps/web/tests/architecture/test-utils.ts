import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const srcRoot = path.resolve(currentDir, "../../src");
export const topLayers = new Set(["app", "pages", "widgets", "features", "entities", "shared"]);

export function walkFiles(
  dir: string,
  shouldInclude: (filePath: string) => boolean = () => true
): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const targetPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(targetPath, shouldInclude));
      continue;
    }

    if (entry.isFile() && shouldInclude(targetPath)) {
      files.push(targetPath);
    }
  }

  return files;
}

export function toSrcRelative(absolutePath: string): string {
  return path.relative(srcRoot, absolutePath);
}

export function isDomainApiClientRelative(relativePath: string): boolean {
  if (!relativePath.endsWith(".client.ts")) {
    return false;
  }

  if (!relativePath.includes(`${path.sep}api${path.sep}`)) {
    return false;
  }

  return relativePath.startsWith(`entities${path.sep}`) || relativePath.startsWith(`features${path.sep}`);
}

export function topLayerFromAbsolute(filePath: string): string | null {
  const relativePath = toSrcRelative(filePath);
  const [layer] = relativePath.split(path.sep);

  if (!layer || layer.startsWith("..")) {
    return null;
  }

  if (!topLayers.has(layer)) {
    return null;
  }

  return layer;
}
