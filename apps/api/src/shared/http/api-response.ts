import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppContext } from "../../app-env";
import { getRequestId } from "./request-id";

type ApiErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  requestId: string;
};

function toStatusCode(status: number): ContentfulStatusCode {
  return status as ContentfulStatusCode;
}

export function jsonError(
  c: AppContext,
  status: number,
  code: string,
  message: string
): Response {
  const responseBody: ApiErrorResponse = {
    ok: false,
    error: { code, message },
    requestId: getRequestId(c)
  };

  return c.json(responseBody, toStatusCode(status));
}

export function jsonOk<T extends Record<string, unknown>>(
  c: AppContext,
  body: T,
  status = 200
): Response {
  return c.json(
    {
      ok: true,
      ...body,
      requestId: getRequestId(c)
    },
    toStatusCode(status)
  );
}

export function errorCodeFromStatus(status: number): string {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 413) return "PAYLOAD_TOO_LARGE";
  if (status === 415) return "UNSUPPORTED_MEDIA_TYPE";
  if (status === 429) return "TOO_MANY_REQUESTS";
  if (status >= 500) return "INTERNAL_ERROR";
  return "REQUEST_FAILED";
}
