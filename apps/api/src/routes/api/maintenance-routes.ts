import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { jsonError, jsonOk } from "../../shared/http/api-response";
import { runImageCleanupTasksUseCase } from "../../usecases/image-cleanup-usecase";
import { useCaseError } from "./shared";

const DEFAULT_CLEANUP_LIMIT = 20;
const MAX_CLEANUP_LIMIT = 100;

function resolveCleanupLimit(raw: string | undefined): number | null {
  if (!raw) {
    return DEFAULT_CLEANUP_LIMIT;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > MAX_CLEANUP_LIMIT) {
    return null;
  }

  return value;
}

export function createMaintenanceRoutes(): Hono<AppEnv> {
  const maintenance = new Hono<AppEnv>();

  maintenance.post("/maintenance/image-cleanup/run", async (c) => {
    const limit = resolveCleanupLimit(c.req.query("limit"));
    if (!limit) {
      return jsonError(c, 400, "INVALID_CLEANUP_LIMIT", "limit must be an integer between 1 and 100");
    }

    const result = await runImageCleanupTasksUseCase(c.env.DB, c.env.ENTITY_IMAGES, limit);
    if (!result.ok) {
      return useCaseError(c, result.status, result.message);
    }

    return jsonOk(c, { cleanup: result.data });
  });

  return maintenance;
}
