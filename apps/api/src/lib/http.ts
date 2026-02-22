import type { ZodTypeAny } from "zod";
import { z } from "zod";
import type { AppContext } from "../app-env";
import { validationMessage } from "../shared/validation/request-schemas";
import { jsonError } from "../shared/http/api-response";

export async function parseJsonBody<TSchema extends ZodTypeAny>(
  c: AppContext,
  schema: TSchema
): Promise<{ ok: true; data: z.infer<TSchema> } | { ok: false; response: Response }> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return {
      ok: false,
      response: jsonError(c, 400, "INVALID_JSON_BODY", "invalid json body")
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(c, 400, "INVALID_REQUEST_BODY", validationMessage(parsed.error))
    };
  }

  return { ok: true, data: parsed.data };
}
