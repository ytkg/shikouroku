const ASSET_FILE_PATH_PATTERN = /\/[^/]+\.[^/]+$/;

export function isStaticAssetPath(pathname: string): boolean {
  if (pathname.startsWith("/assets/")) {
    return true;
  }

  return ASSET_FILE_PATH_PATTERN.test(pathname);
}
