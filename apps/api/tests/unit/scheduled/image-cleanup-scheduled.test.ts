import { describe, expect, it, vi } from "vitest";

vi.mock("../../../src/modules/maintenance/image-cleanup/application/run-image-cleanup-command", () => ({
  runImageCleanupCommand: vi.fn()
}));

import app from "../../../src/index";
import { runImageCleanupCommand } from "../../../src/modules/maintenance/image-cleanup/application/run-image-cleanup-command";

const runImageCleanupCommandMock = vi.mocked(runImageCleanupCommand);

describe("scheduled image cleanup", () => {
  it("runs cleanup command on scheduled event", async () => {
    runImageCleanupCommandMock.mockResolvedValue({
      ok: true,
      data: {
        processed: 0,
        deleted: 0,
        failed: 0,
        remaining: 0
      }
    });

    const worker = app as unknown as {
      scheduled?: (event: ScheduledEvent, env: any, ctx: ExecutionContext) => void;
    };

    const env = {
      DB: {},
      ENTITY_IMAGES: {}
    };
    const waitUntil = vi.fn(async (promise: Promise<void>) => promise);
    const ctx = {
      waitUntil,
      passThroughOnException: vi.fn()
    } as unknown as ExecutionContext;

    worker.scheduled?.({} as ScheduledEvent, env, ctx);

    expect(waitUntil).toHaveBeenCalledTimes(1);
    const scheduledPromise = waitUntil.mock.calls[0]?.[0] as Promise<void>;
    await scheduledPromise;

    expect(runImageCleanupCommandMock).toHaveBeenCalledWith(env.DB, env.ENTITY_IMAGES, 50);
  });
});
