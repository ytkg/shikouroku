import { ApiError } from "@/shared/api/api-error";
import { httpStatus } from "@/shared/config/http-status";
import { toErrorMessage } from "@/shared/lib/error-message";

export const KEEP_CURRENT_ERROR = Symbol("KEEP_CURRENT_ERROR");

type ResolveQueryErrorInput = {
  queryError: unknown;
  ensureAuthorized: (status: number) => boolean;
  notFoundMessage?: string;
};

export function resolveQueryError({
  queryError,
  ensureAuthorized,
  notFoundMessage
}: ResolveQueryErrorInput): string | null | typeof KEEP_CURRENT_ERROR {
  if (!queryError) {
    return null;
  }

  if (queryError instanceof ApiError && !ensureAuthorized(queryError.status)) {
    return KEEP_CURRENT_ERROR;
  }

  if (notFoundMessage && queryError instanceof ApiError && queryError.status === httpStatus.notFound) {
    return notFoundMessage;
  }

  return toErrorMessage(queryError);
}
