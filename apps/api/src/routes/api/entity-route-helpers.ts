import type { AppContext } from "../../app-env";
import {
  resolveEntityListQueryParams,
  type ResolvedEntityListQueryParams
} from "../../modules/catalog/entity/application/entity-list-query-params";
import { jsonError } from "../../shared/http/api-response";

type EntityListQueryResolution =
  | { ok: true; data: ResolvedEntityListQueryParams }
  | { ok: false; response: Response };

export function resolveEntityListQueryFromRequest(c: AppContext): EntityListQueryResolution {
  const resolvedQuery = resolveEntityListQueryParams({
    limit: c.req.query("limit"),
    cursor: c.req.query("cursor"),
    match: c.req.query("match"),
    fields: c.req.query("fields"),
    kindId: c.req.query("kindId"),
    wishlist: c.req.query("wishlist"),
    q: c.req.query("q")
  });
  if (!resolvedQuery.ok) {
    return {
      ok: false,
      response: jsonError(c, 400, resolvedQuery.error.code, resolvedQuery.error.message)
    };
  }

  return {
    ok: true,
    data: resolvedQuery.data
  };
}

type MultipartFileResolution =
  | { ok: true; file: File }
  | { ok: false; response: Response };

export async function parseMultipartFileFromRequest(
  c: AppContext,
  fieldName: string
): Promise<MultipartFileResolution> {
  let formData: FormData;
  try {
    formData = await c.req.raw.formData();
  } catch {
    return {
      ok: false,
      response: jsonError(c, 400, "INVALID_MULTIPART_BODY", "invalid multipart body")
    };
  }

  const file = formData.get(fieldName);
  if (!file || typeof file === "string") {
    return {
      ok: false,
      response: jsonError(c, 400, "IMAGE_FILE_REQUIRED", "file is required")
    };
  }

  return {
    ok: true,
    file
  };
}

export function buildEntityImageFileResponse(
  fileBody: ReadableStream<Uint8Array>,
  mimeType: string,
  fileSize: number
): Response {
  const response = new Response(fileBody);
  response.headers.set("Content-Type", mimeType);
  response.headers.set("Content-Length", String(fileSize));
  response.headers.set("Cache-Control", "private, max-age=300");
  return response;
}
