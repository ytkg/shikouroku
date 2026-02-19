function decodeURIComponentSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function encodePathSegment(value: string): string {
  return encodeURIComponent(decodeURIComponentSafely(value));
}
