import { describe, expect, it, vi } from "vitest";

vi.mock("../../../src/usecases/image-cleanup-usecase", () => ({
  runImageCleanupTasksUseCase: vi.fn()
}));

import app from "../../../src/index";
import { runImageCleanupTasksUseCase } from "../../../src/usecases/image-cleanup-usecase";

const runImageCleanupTasksUseCaseMock = vi.mocked(runImageCleanupTasksUseCase);

describe("scheduled image cleanup", () => {
  it("runs cleanup usecase on scheduled event", async () => {
    runImageCleanupTasksUseCaseMock.mockResolvedValue({
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

    expect(runImageCleanupTasksUseCaseMock).toHaveBeenCalledWith(env.DB, env.ENTITY_IMAGES, 50);
  });
});
