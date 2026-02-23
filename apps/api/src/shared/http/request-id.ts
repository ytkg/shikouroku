import type { MiddlewareHandler } from "hono";
import type { AppContext, AppEnv } from "../../app-env";
import { toMutableResponse } from "./mutable-response";

export const REQUEST_ID_HEADER = "X-Request-Id";

export const requestIdMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const incomingRequestId = c.req.header(REQUEST_ID_HEADER)?.trim();
  const requestId = incomingRequestId && incomingRequestId.length > 0 ? incomingRequestId : crypto.randomUUID();

  c.set("requestId", requestId);
  await next();
  c.res = toMutableResponse(c.res);
  c.res.headers.set(REQUEST_ID_HEADER, requestId);
};

export function getRequestId(c: AppContext): string {
  const requestId = c.get("requestId");
  if (typeof requestId === "string" && requestId.length > 0) {
    return requestId;
  }

  const headerRequestId = c.req.header(REQUEST_ID_HEADER)?.trim();
  if (headerRequestId && headerRequestId.length > 0) {
    return headerRequestId;
  }

  return "unknown";
}
