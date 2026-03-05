import { ApiError } from "@/shared/api/api-error";
import { httpStatus } from "@/shared/config/http-status";
import { toErrorMessage } from "@/shared/lib/error-message";

export const KEEP_CURRENT_ERROR = Symbol("KEEP_CURRENT_ERROR");

export type ResolveQueryErrorInput = {
  queryError: unknown;
  ensureAuthorized: (status: number) => boolean;
  notFoundMessage?: string;
};

export function shouldKeepCurrentError(
  queryError: unknown,
  ensureAuthorized: (status: number) => boolean
): boolean {
  return queryError instanceof ApiError && !ensureAuthorized(queryError.status);
}

export function resolveQueryError({
  queryError,
  ensureAuthorized,
  notFoundMessage
}: ResolveQueryErrorInput): string | null | typeof KEEP_CURRENT_ERROR {
  if (!queryError) {
    return null;
  }

  if (shouldKeepCurrentError(queryError, ensureAuthorized)) {
    return KEEP_CURRENT_ERROR;
  }

  if (notFoundMessage && queryError instanceof ApiError && queryError.status === httpStatus.notFound) {
    return notFoundMessage;
  }

  return toErrorMessage(queryError);
}

export function applyResolvedQueryError(
  setError: (nextError: string | null) => void,
  input: ResolveQueryErrorInput
): void {
  const nextError = resolveQueryError(input);
  if (nextError !== KEEP_CURRENT_ERROR) {
    setError(nextError);
  }
}
