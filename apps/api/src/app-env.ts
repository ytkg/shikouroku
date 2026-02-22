import { Context } from "hono";

export type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
  ENTITY_IMAGES: R2Bucket;
  AUTH_BASE_URL: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    requestId: string;
  };
};

export type AppContext = Context<AppEnv>;
