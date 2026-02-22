import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/repositories/entity-repository", () => ({
  findEntityById: vi.fn()
}));

vi.mock("../../../../../../src/repositories/entity-image-repository", () => ({
  collapseEntityImageSortOrderAfterDelete: vi.fn(),
  deleteEntityImage: vi.fn(),
  findEntityImageById: vi.fn(),
  insertEntityImage: vi.fn(),
  listEntityImages: vi.fn(),
  nextEntityImageSortOrder: vi.fn(),
  reorderEntityImages: vi.fn()
}));

vi.mock("../../../../../../src/repositories/image-cleanup-task-repository", () => ({
  enqueueImageCleanupTask: vi.fn()
}));

import { findEntityById } from "../../../../../../src/repositories/entity-repository";
import {
  collapseEntityImageSortOrderAfterDelete,
  deleteEntityImage,
  findEntityImageById,
  insertEntityImage,
  nextEntityImageSortOrder
} from "../../../../../../src/repositories/entity-image-repository";
import { enqueueImageCleanupTask } from "../../../../../../src/repositories/image-cleanup-task-repository";
import { deleteEntityImageCommand } from "../../../../../../src/modules/catalog/image/application/delete-entity-image-command";
import { uploadEntityImageCommand } from "../../../../../../src/modules/catalog/image/application/upload-entity-image-command";

const findEntityByIdMock = vi.mocked(findEntityById);
const findEntityImageByIdMock = vi.mocked(findEntityImageById);
const deleteEntityImageMock = vi.mocked(deleteEntityImage);
const collapseEntityImageSortOrderAfterDeleteMock = vi.mocked(collapseEntityImageSortOrderAfterDelete);
const enqueueImageCleanupTaskMock = vi.mocked(enqueueImageCleanupTask);
const nextEntityImageSortOrderMock = vi.mocked(nextEntityImageSortOrder);
const insertEntityImageMock = vi.mocked(insertEntityImage);

function createMockImageBucket() {
  return {
    put: vi.fn(async () => undefined),
    get: vi.fn(async () => null),
    delete: vi.fn(async () => undefined)
  } as unknown as R2Bucket;
}

describe("image module application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("schedules cleanup and returns success when image deletion on R2 fails", async () => {
    const db = {} as D1Database;
    const imageBucket = createMockImageBucket();
    const deleteMock = vi.fn(async () => {
      throw new Error("r2 unavailable");
    });
    (imageBucket.delete as unknown as typeof deleteMock) = deleteMock;

    findEntityByIdMock.mockResolvedValue({
      id: "entity-1"
    } as any);
    findEntityImageByIdMock.mockResolvedValue({
      id: "img-1",
      entity_id: "entity-1",
      object_key: "entities/entity-1/img-1.png",
      file_name: "img-1.png",
      mime_type: "image/png",
      file_size: 1000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z"
    });
    deleteEntityImageMock.mockResolvedValue("deleted");
    collapseEntityImageSortOrderAfterDeleteMock.mockResolvedValue(true);
    enqueueImageCleanupTaskMock.mockResolvedValue(true);

    const result = await deleteEntityImageCommand(db, imageBucket, "entity-1", "img-1");

    expect(result.ok).toBe(true);
    expect(enqueueImageCleanupTaskMock).toHaveBeenCalledWith(
      db,
      "entities/entity-1/img-1.png",
      "entity_image_delete_failed",
      "r2 unavailable"
    );
  });

  it("returns failure when R2 deletion fails and cleanup enqueue also fails", async () => {
    const db = {} as D1Database;
    const imageBucket = createMockImageBucket();
    const deleteMock = vi.fn(async () => {
      throw new Error("r2 unavailable");
    });
    (imageBucket.delete as unknown as typeof deleteMock) = deleteMock;

    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    findEntityImageByIdMock.mockResolvedValue({
      id: "img-1",
      entity_id: "entity-1",
      object_key: "entities/entity-1/img-1.png",
      file_name: "img-1.png",
      mime_type: "image/png",
      file_size: 1000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z"
    });
    deleteEntityImageMock.mockResolvedValue("deleted");
    collapseEntityImageSortOrderAfterDeleteMock.mockResolvedValue(true);
    enqueueImageCleanupTaskMock.mockResolvedValue(false);

    const result = await deleteEntityImageCommand(db, imageBucket, "entity-1", "img-1");

    expect(result).toEqual({
      ok: false,
      status: 500,
      message: "failed to delete image file and schedule cleanup"
    });
  });

  it("schedules cleanup when metadata insert fails and rollback delete fails", async () => {
    const db = {} as D1Database;
    const imageBucket = createMockImageBucket();
    const rollbackDeleteMock = vi.fn(async () => {
      throw new Error("r2 delete failed");
    });
    (imageBucket.delete as unknown as typeof rollbackDeleteMock) = rollbackDeleteMock;

    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    nextEntityImageSortOrderMock.mockResolvedValue(1);
    insertEntityImageMock.mockResolvedValue(false);
    enqueueImageCleanupTaskMock.mockResolvedValue(true);

    const file = {
      name: "sample.png",
      type: "image/png",
      size: 123,
      arrayBuffer: async () => new ArrayBuffer(8)
    };

    const result = await uploadEntityImageCommand(db, imageBucket, "entity-1", file);

    expect(result).toEqual({
      ok: false,
      status: 500,
      message: "failed to save image metadata"
    });
    expect(enqueueImageCleanupTaskMock).toHaveBeenCalledWith(
      db,
      expect.stringContaining("entities/entity-1/"),
      "metadata_insert_failed",
      "r2 delete failed"
    );
  });
});
