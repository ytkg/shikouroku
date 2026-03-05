import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteEntityImageCommand } from "../../../../../../src/modules/catalog/image/application/delete-entity-image-command";
import { uploadEntityImageCommand } from "../../../../../../src/modules/catalog/image/application/upload-entity-image-command";
import type { EntityReadRepository } from "../../../../../../src/modules/catalog/entity/ports/entity-read-repository";
import type { EntityImageRepository } from "../../../../../../src/modules/catalog/image/ports/entity-image-repository";
import type { ImageCleanupTaskRepository } from "../../../../../../src/modules/maintenance/image-cleanup/ports/image-cleanup-task-repository";

const findEntityByIdMock = vi.fn();
const findEntityImageByIdMock = vi.fn();
const deleteEntityImageAndCollapseSortOrderMock = vi.fn();
const nextEntityImageSortOrderMock = vi.fn();
const insertEntityImageMock = vi.fn();
const enqueueTaskMock = vi.fn();

const entityReadRepository: Pick<EntityReadRepository, "findEntityById"> = {
  findEntityById: findEntityByIdMock
};

const entityImageRepository: Pick<
  EntityImageRepository,
  "findEntityImageById" | "deleteEntityImageAndCollapseSortOrder" | "nextEntityImageSortOrder" | "insertEntityImage"
> = {
  findEntityImageById: findEntityImageByIdMock,
  deleteEntityImageAndCollapseSortOrder: deleteEntityImageAndCollapseSortOrderMock,
  nextEntityImageSortOrder: nextEntityImageSortOrderMock,
  insertEntityImage: insertEntityImageMock
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
    deleteEntityImageAndCollapseSortOrderMock.mockResolvedValue("deleted");
    enqueueTaskMock.mockResolvedValue("enqueued");

    const result = await deleteEntityImageCommand(
      imageBucket,
      entityReadRepository,
      entityImageRepository,
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
    deleteEntityImageAndCollapseSortOrderMock.mockResolvedValue("deleted");
    enqueueTaskMock.mockResolvedValue("error");

    const result = await deleteEntityImageCommand(
      imageBucket,
      entityReadRepository,
      entityImageRepository,
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
    const imageBucket = createMockImageBucket();
    const rollbackDeleteMock = vi.fn(async () => {
      throw new Error("r2 delete failed");
    });
    (imageBucket.delete as unknown as typeof rollbackDeleteMock) = rollbackDeleteMock;

    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    nextEntityImageSortOrderMock.mockResolvedValue(1);
    insertEntityImageMock.mockResolvedValue(false);
    enqueueTaskMock.mockResolvedValue("enqueued");

    const file = {
      name: "sample.png",
      type: "image/png",
      size: 123,
      arrayBuffer: async () => new ArrayBuffer(8)
    };

    const result = await uploadEntityImageCommand(
      imageBucket,
      entityReadRepository,
      entityImageRepository,
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

  it("returns metadata failure when cleanup enqueue returns error after rollback delete fails", async () => {
    const imageBucket = createMockImageBucket();
    const rollbackDeleteMock = vi.fn(async () => {
      throw new Error("r2 delete failed");
    });
    (imageBucket.delete as unknown as typeof rollbackDeleteMock) = rollbackDeleteMock;

    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    nextEntityImageSortOrderMock.mockResolvedValue(1);
    insertEntityImageMock.mockResolvedValue(false);
    enqueueTaskMock.mockResolvedValue("error");

    const file = {
      name: "sample.png",
      type: "image/png",
      size: 123,
      arrayBuffer: async () => new ArrayBuffer(8)
    };

    const result = await uploadEntityImageCommand(
      imageBucket,
      entityReadRepository,
      entityImageRepository,
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
