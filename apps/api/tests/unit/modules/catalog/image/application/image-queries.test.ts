import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEntityImageFileQuery } from "../../../../../../src/modules/catalog/image/application/get-entity-image-file-query";
import { listEntityImagesQuery } from "../../../../../../src/modules/catalog/image/application/list-entity-images-query";
import { reorderEntityImagesCommand } from "../../../../../../src/modules/catalog/image/application/reorder-entity-images-command";
import type { EntityReadRepository } from "../../../../../../src/modules/catalog/entity/ports/entity-read-repository";
import type { EntityImageRepository } from "../../../../../../src/modules/catalog/image/ports/entity-image-repository";

function createEntityImage(id: string, sortOrder: number) {
  return {
    id,
    entity_id: "entity-1",
    object_key: `entities/entity-1/${id}.png`,
    file_name: `${id}.png`,
    mime_type: "image/png",
    file_size: 1000,
    sort_order: sortOrder,
    created_at: "2026-01-01T00:00:00.000Z"
  };
}

describe("image module queries", () => {
  const findEntityByIdMock = vi.fn();
  const listEntityImagesMock = vi.fn();
  const findEntityImageByIdMock = vi.fn();
  const reorderEntityImagesMock = vi.fn();
  const entityReadRepository: Pick<EntityReadRepository, "findEntityById"> = {
    findEntityById: findEntityByIdMock
  };
  const entityImageRepository: Pick<
    EntityImageRepository,
    "listEntityImages" | "findEntityImageById" | "reorderEntityImages"
  > = {
    listEntityImages: listEntityImagesMock,
    findEntityImageById: findEntityImageByIdMock,
    reorderEntityImages: reorderEntityImagesMock
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listEntityImagesQuery maps image records to response DTO", async () => {
    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    listEntityImagesMock.mockResolvedValue([createEntityImage("img-1", 1)]);

    const result = await listEntityImagesQuery(entityReadRepository, entityImageRepository, "entity-1");

    expect(result).toEqual({
      ok: true,
      data: {
        images: [
          {
            id: "img-1",
            entity_id: "entity-1",
            file_name: "img-1.png",
            mime_type: "image/png",
            file_size: 1000,
            sort_order: 1,
            url: "/api/entities/entity-1/images/img-1/file",
            created_at: "2026-01-01T00:00:00.000Z"
          }
        ]
      }
    });
    expect(listEntityImagesMock).toHaveBeenCalledWith("entity-1");
  });

  it("getEntityImageFileQuery returns image metadata and file", async () => {
    const image = createEntityImage("img-1", 1);
    const file = { body: {} } as R2ObjectBody;
    const imageBucket = {
      get: vi.fn(async () => file)
    } as unknown as R2Bucket;

    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    findEntityImageByIdMock.mockResolvedValue(image);

    const result = await getEntityImageFileQuery(
      entityImageRepository,
      imageBucket,
      entityReadRepository,
      "entity-1",
      "img-1"
    );

    expect(result).toEqual({
      ok: true,
      data: {
        image,
        file
      }
    });
    expect(findEntityImageByIdMock).toHaveBeenCalledWith("entity-1", "img-1");
  });

  it("reorderEntityImagesCommand does not write when order is unchanged", async () => {
    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    listEntityImagesMock.mockResolvedValue([createEntityImage("img-1", 1), createEntityImage("img-2", 2)]);

    const result = await reorderEntityImagesCommand(
      entityReadRepository,
      entityImageRepository,
      "entity-1",
      ["img-1", "img-2"]
    );

    expect(result).toEqual({
      ok: true,
      data: {}
    });
    expect(reorderEntityImagesMock).not.toHaveBeenCalled();
  });
});
