import { Hono } from "hono";
import type { AppEnv } from "./app-env";
import { authSessionMiddleware } from "./middleware/auth-session-middleware";
import { createApiRouter } from "./routes/api-router";
import { requestIdMiddleware } from "./shared/http/request-id";
import { runImageCleanupTasksUseCase } from "./usecases/image-cleanup-usecase";

const app = new Hono<AppEnv>();
const SCHEDULED_CLEANUP_LIMIT = 50;

async function resolveSpaAsset(request: Request, assets: Fetcher): Promise<Response> {
  const assetResponse = await assets.fetch(request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  const indexRequest = new Request(new URL("/index.html", request.url), request);
  return assets.fetch(indexRequest);
}

app.use("*", requestIdMiddleware);
app.use("*", authSessionMiddleware);

app.route("/api", createApiRouter());

app.all("*", async (c) => {
  return resolveSpaAsset(c.req.raw, c.env.ASSETS);
});

const worker = app as Hono<AppEnv> & {
  scheduled: (event: ScheduledEvent, env: AppEnv["Bindings"], ctx: ExecutionContext) => void;
};

worker.scheduled = (_event, env, ctx) => {
  ctx.waitUntil(
    (async () => {
      const result = await runImageCleanupTasksUseCase(env.DB, env.ENTITY_IMAGES, SCHEDULED_CLEANUP_LIMIT);
      if (!result.ok) {
        console.error("scheduled image cleanup failed", {
          status: result.status,
          message: result.message
        });
      }
    })()
  );
};

export default worker;
