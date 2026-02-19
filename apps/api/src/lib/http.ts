import type { ZodTypeAny } from "zod";
import { z } from "zod";
import type { AppContext } from "../app-env";
import { validationMessage } from "../domain/schemas";

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
      response: c.json({ ok: false, message: "invalid json body" }, 400)
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json({ ok: false, message: validationMessage(parsed.error) }, 400)
    };
  }

  return { ok: true, data: parsed.data };
}
