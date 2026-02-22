import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/modules/maintenance/image-cleanup/application/list-image-cleanup-tasks-query", () => ({
  listImageCleanupTasksQuery: vi.fn()
}));

vi.mock("../../../src/modules/maintenance/image-cleanup/application/run-image-cleanup-command", () => ({
  runImageCleanupCommand: vi.fn()
}));

import { listImageCleanupTasksQuery } from "../../../src/modules/maintenance/image-cleanup/application/list-image-cleanup-tasks-query";
import { runImageCleanupCommand } from "../../../src/modules/maintenance/image-cleanup/application/run-image-cleanup-command";
import { listImageCleanupTasksUseCase, runImageCleanupTasksUseCase } from "../../../src/usecases/image-cleanup-usecase";

const listImageCleanupTasksQueryMock = vi.mocked(listImageCleanupTasksQuery);
const runImageCleanupCommandMock = vi.mocked(runImageCleanupCommand);

describe("image-cleanup usecase compatibility wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates run usecase to module command", async () => {
    const db = {} as D1Database;
    const imageBucket = {} as R2Bucket;
    runImageCleanupCommandMock.mockResolvedValue({
      ok: true,
      data: {
        processed: 1,
        deleted: 1,
        failed: 0,
        remaining: 0
      }
    });

    const result = await runImageCleanupTasksUseCase(db, imageBucket, 10);

    expect(result).toEqual({
      ok: true,
      data: {
        processed: 1,
        deleted: 1,
        failed: 0,
        remaining: 0
      }
    });
    expect(runImageCleanupCommandMock).toHaveBeenCalledWith(db, imageBucket, 10);
  });

  it("delegates list usecase to module query", async () => {
    const db = {} as D1Database;
    listImageCleanupTasksQueryMock.mockResolvedValue({
      ok: true,
      data: {
        tasks: [],
        total: 0
      }
    });

    const result = await listImageCleanupTasksUseCase(db, 20);

    expect(result).toEqual({
      ok: true,
      data: {
        tasks: [],
        total: 0
      }
    });
    expect(listImageCleanupTasksQueryMock).toHaveBeenCalledWith(db, 20);
  });
});
