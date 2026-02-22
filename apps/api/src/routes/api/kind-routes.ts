import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { listKindsQuery } from "../../modules/catalog/kind/application/list-kinds-query";
import { jsonOk } from "../../shared/http/api-response";
import { useCaseError } from "./shared";

export function createKindRoutes(): Hono<AppEnv> {
  const kinds = new Hono<AppEnv>();

  kinds.get("/kinds", async (c) => {
    const result = await listKindsQuery(c.env.DB);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { kinds: result.data.kinds });
  });

  return kinds;
}
