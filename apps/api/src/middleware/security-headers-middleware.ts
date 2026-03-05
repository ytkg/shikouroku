import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env";
import { toMutableResponse } from "../shared/http/mutable-response";

export const CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy";
export const STRICT_TRANSPORT_SECURITY_HEADER = "Strict-Transport-Security";
export const STRICT_TRANSPORT_SECURITY_VALUE = "max-age=31536000; includeSubDomains";

export const COMMON_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()"
};

export const HTML_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests"
].join("; ");

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  if (!contentType) {
    return false;
  }

  return contentType.toLowerCase().includes("text/html");
}

function isHttpsRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto === "https") {
    return true;
  }
  if (forwardedProto === "http") {
    return false;
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export const securityHeadersMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();

  const response = toMutableResponse(c.res);

  for (const [headerName, headerValue] of Object.entries(COMMON_SECURITY_HEADERS)) {
    response.headers.set(headerName, headerValue);
  }

  if (isHttpsRequest(c.req.raw)) {
    response.headers.set(STRICT_TRANSPORT_SECURITY_HEADER, STRICT_TRANSPORT_SECURITY_VALUE);
  } else {
    response.headers.delete(STRICT_TRANSPORT_SECURITY_HEADER);
  }

  if (isHtmlResponse(response)) {
    response.headers.set(CONTENT_SECURITY_POLICY_HEADER, HTML_CONTENT_SECURITY_POLICY);
  } else {
    response.headers.delete(CONTENT_SECURITY_POLICY_HEADER);
  }

  c.res = response;
};

