import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { listKindsQuery } from "../../modules/catalog/kind/application/list-kinds-query";
import { createD1KindRepository } from "../../modules/catalog/kind/infra/kind-repository-d1";
import { jsonOk } from "../../shared/http/api-response";
import { useCaseError } from "./shared";

export function createKindRoutes(): Hono<AppEnv> {
  const kinds = new Hono<AppEnv>();

  kinds.get("/kinds", async (c) => {
    const kindRepository = createD1KindRepository(c.env.DB);
    const result = await listKindsQuery(kindRepository);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { kinds: result.data.kinds });
  });

  return kinds;
}
