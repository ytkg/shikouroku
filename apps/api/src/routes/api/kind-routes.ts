import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { jsonOk } from "../../shared/http/api-response";
import { listKindsUseCase } from "../../usecases/kinds-usecase";
import { useCaseError } from "./shared";

export function createKindRoutes(): Hono<AppEnv> {
  const kinds = new Hono<AppEnv>();

  kinds.get("/kinds", async (c) => {
    const result = await listKindsUseCase(c.env.DB);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { kinds: result.data.kinds });
  });

  return kinds;
}
