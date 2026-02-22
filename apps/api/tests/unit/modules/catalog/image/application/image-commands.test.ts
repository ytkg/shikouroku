import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/modules/catalog/image/infra/image-repository-d1", () => ({
  deleteEntityImageAndCollapseSortOrderInD1: vi.fn(),
  findEntityImageByIdFromD1: vi.fn(),
  insertEntityImageInD1: vi.fn(),
  listEntityImagesFromD1: vi.fn(),
  nextEntityImageSortOrderFromD1: vi.fn(),
  reorderEntityImagesInD1: vi.fn()
}));

import {
  deleteEntityImageAndCollapseSortOrderInD1,
  findEntityImageByIdFromD1,
  insertEntityImageInD1,
  nextEntityImageSortOrderFromD1
} from "../../../../../../src/modules/catalog/image/infra/image-repository-d1";
import { deleteEntityImageCommand } from "../../../../../../src/modules/catalog/image/application/delete-entity-image-command";
import { uploadEntityImageCommand } from "../../../../../../src/modules/catalog/image/application/upload-entity-image-command";
import type { EntityReadRepository } from "../../../../../../src/modules/catalog/entity/ports/entity-read-repository";
import type { ImageCleanupTaskRepository } from "../../../../../../src/modules/maintenance/image-cleanup/ports/image-cleanup-task-repository";

const findEntityImageByIdFromD1Mock = vi.mocked(findEntityImageByIdFromD1);
const deleteEntityImageAndCollapseSortOrderInD1Mock = vi.mocked(deleteEntityImageAndCollapseSortOrderInD1);
const nextEntityImageSortOrderFromD1Mock = vi.mocked(nextEntityImageSortOrderFromD1);
const insertEntityImageInD1Mock = vi.mocked(insertEntityImageInD1);
const findEntityByIdMock = vi.fn();
const enqueueTaskMock = vi.fn();
const entityReadRepository: Pick<EntityReadRepository, "findEntityById"> = {
  findEntityById: findEntityByIdMock
};
const imageCleanupTaskRepository: Pick<ImageCleanupTaskRepository, "enqueueTask"> = {
  enqueueTask: enqueueTaskMock
};

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
    deleteEntityImageAndCollapseSortOrderInD1Mock.mockResolvedValue("deleted");
    enqueueTaskMock.mockResolvedValue(true);

    const result = await deleteEntityImageCommand(
      db,
      imageBucket,
      entityReadRepository,
      imageCleanupTaskRepository,
      "entity-1",
      "img-1"
    );

    expect(result.ok).toBe(true);
    expect(enqueueTaskMock).toHaveBeenCalledWith(
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
    deleteEntityImageAndCollapseSortOrderInD1Mock.mockResolvedValue("deleted");
    enqueueTaskMock.mockResolvedValue(false);

    const result = await deleteEntityImageCommand(
      db,
      imageBucket,
      entityReadRepository,
      imageCleanupTaskRepository,
      "entity-1",
      "img-1"
    );

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
    nextEntityImageSortOrderFromD1Mock.mockResolvedValue(1);
    insertEntityImageInD1Mock.mockResolvedValue(false);
    enqueueTaskMock.mockResolvedValue(true);

    const file = {
      name: "sample.png",
      type: "image/png",
      size: 123,
      arrayBuffer: async () => new ArrayBuffer(8)
    };

    const result = await uploadEntityImageCommand(
      db,
      imageBucket,
      entityReadRepository,
      imageCleanupTaskRepository,
      "entity-1",
      file
    );

    expect(result).toEqual({
      ok: false,
      status: 500,
      message: "failed to save image metadata"
    });
    expect(enqueueTaskMock).toHaveBeenCalledWith(
      expect.stringContaining("entities/entity-1/"),
      "metadata_insert_failed",
      "r2 delete failed"
    );
  });
});
