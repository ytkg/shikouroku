import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/modules/catalog/entity/infra/entity-repository-d1", () => ({
  findEntityByIdFromD1: vi.fn()
}));

vi.mock("../../../../../../src/modules/catalog/image/infra/image-repository-d1", () => ({
  collapseEntityImageSortOrderAfterDeleteInD1: vi.fn(),
  deleteEntityImageInD1: vi.fn(),
  findEntityImageByIdFromD1: vi.fn(),
  insertEntityImageInD1: vi.fn(),
  listEntityImagesFromD1: vi.fn(),
  nextEntityImageSortOrderFromD1: vi.fn(),
  reorderEntityImagesInD1: vi.fn()
}));

vi.mock(
  "../../../../../../src/modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1",
  () => ({
    enqueueImageCleanupTaskToD1: vi.fn()
  })
);

import { findEntityByIdFromD1 } from "../../../../../../src/modules/catalog/entity/infra/entity-repository-d1";
import {
  collapseEntityImageSortOrderAfterDeleteInD1,
  deleteEntityImageInD1,
  findEntityImageByIdFromD1,
  insertEntityImageInD1,
  nextEntityImageSortOrderFromD1
} from "../../../../../../src/modules/catalog/image/infra/image-repository-d1";
import { deleteEntityImageCommand } from "../../../../../../src/modules/catalog/image/application/delete-entity-image-command";
import { uploadEntityImageCommand } from "../../../../../../src/modules/catalog/image/application/upload-entity-image-command";
import { enqueueImageCleanupTaskToD1 } from "../../../../../../src/modules/maintenance/image-cleanup/infra/image-cleanup-task-repository-d1";

const findEntityByIdFromD1Mock = vi.mocked(findEntityByIdFromD1);
const findEntityImageByIdFromD1Mock = vi.mocked(findEntityImageByIdFromD1);
const deleteEntityImageInD1Mock = vi.mocked(deleteEntityImageInD1);
const collapseEntityImageSortOrderAfterDeleteInD1Mock = vi.mocked(
  collapseEntityImageSortOrderAfterDeleteInD1
);
const enqueueImageCleanupTaskToD1Mock = vi.mocked(enqueueImageCleanupTaskToD1);
const nextEntityImageSortOrderFromD1Mock = vi.mocked(nextEntityImageSortOrderFromD1);
const insertEntityImageInD1Mock = vi.mocked(insertEntityImageInD1);

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

    findEntityByIdFromD1Mock.mockResolvedValue({
      id: "entity-1"
    } as any);
    findEntityImageByIdFromD1Mock.mockResolvedValue({
      id: "img-1",
      entity_id: "entity-1",
      object_key: "entities/entity-1/img-1.png",
      file_name: "img-1.png",
      mime_type: "image/png",
      file_size: 1000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z"
    });
    deleteEntityImageInD1Mock.mockResolvedValue("deleted");
    collapseEntityImageSortOrderAfterDeleteInD1Mock.mockResolvedValue(true);
    enqueueImageCleanupTaskToD1Mock.mockResolvedValue(true);

    const result = await deleteEntityImageCommand(db, imageBucket, "entity-1", "img-1");

    expect(result.ok).toBe(true);
    expect(enqueueImageCleanupTaskToD1Mock).toHaveBeenCalledWith(
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

    findEntityByIdFromD1Mock.mockResolvedValue({ id: "entity-1" } as any);
    findEntityImageByIdFromD1Mock.mockResolvedValue({
      id: "img-1",
      entity_id: "entity-1",
      object_key: "entities/entity-1/img-1.png",
      file_name: "img-1.png",
      mime_type: "image/png",
      file_size: 1000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z"
    });
    deleteEntityImageInD1Mock.mockResolvedValue("deleted");
    collapseEntityImageSortOrderAfterDeleteInD1Mock.mockResolvedValue(true);
    enqueueImageCleanupTaskToD1Mock.mockResolvedValue(false);

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

    findEntityByIdFromD1Mock.mockResolvedValue({ id: "entity-1" } as any);
    nextEntityImageSortOrderFromD1Mock.mockResolvedValue(1);
    insertEntityImageInD1Mock.mockResolvedValue(false);
    enqueueImageCleanupTaskToD1Mock.mockResolvedValue(true);

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
    expect(enqueueImageCleanupTaskToD1Mock).toHaveBeenCalledWith(
      db,
      expect.stringContaining("entities/entity-1/"),
      "metadata_insert_failed",
      "r2 delete failed"
    );
  });
});
