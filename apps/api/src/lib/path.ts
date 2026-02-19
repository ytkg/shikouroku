export function isStaticAssetPath(pathname: string): boolean {
  return pathname.includes(".") || pathname.startsWith("/assets/");
}
