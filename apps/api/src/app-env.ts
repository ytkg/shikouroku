import { Context } from "hono";

export type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
};

export type AppEnv = {
  Bindings: Bindings;
};

export type AppContext = Context<AppEnv>;
