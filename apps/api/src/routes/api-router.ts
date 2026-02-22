import { Hono } from "hono";
import type { AppEnv } from "../app-env";
import { jsonError } from "../shared/http/api-response";
import { createAuthRoutes } from "./api/auth-routes";
import { createEntityRoutes } from "./api/entity-routes";
import { createKindRoutes } from "./api/kind-routes";
import { createTagRoutes } from "./api/tag-routes";

export function createApiRouter(): Hono<AppEnv> {
  const api = new Hono<AppEnv>();

  api.route("/", createAuthRoutes());
  api.route("/", createKindRoutes());
  api.route("/", createTagRoutes());
  api.route("/", createEntityRoutes());

  api.all("*", (c) => {
    return jsonError(c, 404, "NOT_FOUND", "not found");
  });

  return api;
}
