import { Hono } from "hono";
import type { AppEnv } from "./app-env";
import { authSessionMiddleware } from "./middleware/auth-session-middleware";
import { createApiRouter } from "./routes/api-router";
import { requestIdMiddleware } from "./shared/http/request-id";

const app = new Hono<AppEnv>();

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

export default app;
