import { createInvalidApiResponseError } from "@/shared/api/api-error";

type JsonObject = Record<string, unknown>;

function fail(path: string, expected: string): never {
  throw createInvalidApiResponseError(`Invalid API response: ${path} must be ${expected}`);
}

export function expectObject(value: unknown, path: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(path, "an object");
  }

  return value as JsonObject;
}

export function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(path, "an array");
  }

  return value;
}

export function expectString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    fail(path, "a string");
  }

  return value;
}

export function expectNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(path, "a number");
  }

  return value;
}

export function expectNullableString(value: unknown, path: string): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  fail(path, "a string or null");
}

export function expectOptionalString(value: unknown, path: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  fail(path, "a string when present");
}

export function expectTrue(value: unknown, path: string): true {
  if (value !== true) {
    fail(path, "true");
  }

  return true;
}
