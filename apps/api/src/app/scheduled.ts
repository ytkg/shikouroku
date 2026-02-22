import type { Hono } from "hono";
import type { AppEnv } from "../app-env";
import { runImageCleanupCommand } from "../modules/maintenance/image-cleanup/application/run-image-cleanup-command";

const SCHEDULED_CLEANUP_LIMIT = 50;

export type ScheduledWorker = Hono<AppEnv> & {
  scheduled: (event: ScheduledEvent, env: AppEnv["Bindings"], ctx: ExecutionContext) => void;
};

export function withScheduledHandler(app: Hono<AppEnv>): ScheduledWorker {
  const worker = app as ScheduledWorker;

  worker.scheduled = (_event, env, ctx) => {
    ctx.waitUntil(
      (async () => {
        const result = await runImageCleanupCommand(env.DB, env.ENTITY_IMAGES, SCHEDULED_CLEANUP_LIMIT);
        if (!result.ok) {
          console.error("scheduled image cleanup failed", {
            status: result.status,
            message: result.message
          });
        }
      })()
    );
  };

  return worker;
}
