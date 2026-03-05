import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEntityCommand } from "../../../../../../src/modules/catalog/entity/application/create-entity-command";
import { getEntityQuery } from "../../../../../../src/modules/catalog/entity/application/get-entity-query";
import { listEntitiesQuery } from "../../../../../../src/modules/catalog/entity/application/list-entities-query";
import { updateEntityCommand } from "../../../../../../src/modules/catalog/entity/application/update-entity-command";
import type { EntityApplicationRepository } from "../../../../../../src/modules/catalog/entity/ports/entity-application-repository";

const findKindByIdMock = vi.fn();
const countExistingTagsByIdsMock = vi.fn();
const findEntityIdByKindAndNameMock = vi.fn();
const insertEntityWithTagsMock = vi.fn();
const updateEntityWithTagsMock = vi.fn();
const fetchEntityWithTagsMock = vi.fn();
const findEntityWithKindByIdMock = vi.fn();
const findEntityLocationByEntityIdMock = vi.fn();
const fetchTagsByEntityIdsMock = vi.fn();
const listEntitiesWithKindsMock = vi.fn();
const countEntitiesWithKindsMock = vi.fn();

const entityRepository: EntityApplicationRepository = {
  findEntityIdByKindAndName: findEntityIdByKindAndNameMock,
  insertEntityWithTags: insertEntityWithTagsMock,
  updateEntityWithTags: updateEntityWithTagsMock,
  fetchEntityWithTags: fetchEntityWithTagsMock,
  findEntityWithKindById: findEntityWithKindByIdMock,
  findEntityLocationByEntityId: findEntityLocationByEntityIdMock,
  fetchTagsByEntityIds: fetchTagsByEntityIdsMock,
  listEntitiesWithKinds: listEntitiesWithKindsMock,
  countEntitiesWithKinds: countEntitiesWithKindsMock,
  listEntityLocationsWithKinds: vi.fn()
};
const kindRepository = { findKindById: findKindByIdMock };
const tagRepository = { countExistingTagsByIds: countExistingTagsByIdsMock };

describe("entity module application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listEntitiesQuery maps first image url and tags with page metadata", async () => {
    countEntitiesWithKindsMock.mockResolvedValue(1);
    listEntitiesWithKindsMock.mockResolvedValue([
      {
        id: "entity-1",
        kind_id: 1,
        kind_label: "Book",
        name: "DDD",
        description: null,
        is_wishlist: 0,
        first_image_id: "img-1",
        created_at: "2026-01-01",
        updated_at: "2026-01-01"
      }
    ] as any);
    fetchTagsByEntityIdsMock.mockResolvedValue(new Map([["entity-1", [{ id: 10, name: "arch" }]]]));

    const result = await listEntitiesQuery(entityRepository, {
      limit: 20,
      cursor: null,
      kindId: null,
      wishlist: "include",
      q: "",
      match: "partial",
      fields: ["title", "body", "tags"]
    });

    expect(result).toEqual({
      ok: true,
      data: {
        entities: [
          {
            id: "entity-1",
            kind: { id: 1, label: "Book" },
            name: "DDD",
            description: null,
            is_wishlist: 0,
            tags: [{ id: 10, name: "arch" }],
            first_image_url: "/api/entities/entity-1/images/img-1/file",
            created_at: "2026-01-01",
            updated_at: "2026-01-01"
          }
        ],
        page: {
          limit: 20,
          hasMore: false,
          nextCursor: null,
          total: 1
        }
      }
    });
  });

  it("getEntityQuery returns 404 when entity does not exist", async () => {
    findEntityWithKindByIdMock.mockResolvedValue(null);

    const result = await getEntityQuery(entityRepository, "entity-1");

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "entity not found"
    });
  });

  it("getEntityQuery returns location when entity has location data", async () => {
    findEntityWithKindByIdMock.mockResolvedValue({
      id: "entity-1",
      kind_id: 1,
      kind_label: "場所",
      name: "Tokyo",
      description: null,
      is_wishlist: 0,
      created_at: "2026-01-01",
      updated_at: "2026-01-01"
    } as any);
    fetchTagsByEntityIdsMock.mockResolvedValue(new Map());
    findEntityLocationByEntityIdMock.mockResolvedValue({
      entity_id: "entity-1",
      latitude: 35.68,
      longitude: 139.77,
      created_at: "2026-01-01",
      updated_at: "2026-01-01"
    } as any);

    const result = await getEntityQuery(entityRepository, "entity-1");

    expect(result).toEqual({
      ok: true,
      data: {
        entity: {
          id: "entity-1",
          kind: { id: 1, label: "場所" },
          name: "Tokyo",
          description: null,
          is_wishlist: 0,
          tags: [],
          location: {
            latitude: 35.68,
            longitude: 139.77
          },
          created_at: "2026-01-01",
          updated_at: "2026-01-01"
        }
      }
    });
  });

  it("createEntityCommand returns failure when entity/tag batch insert fails", async () => {
    const randomUUIDSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue("entity-new");
    findKindByIdMock.mockResolvedValue({ id: 1, label: "Book" } as any);
    findEntityIdByKindAndNameMock.mockResolvedValue(null);
    countExistingTagsByIdsMock.mockResolvedValue(1);
    insertEntityWithTagsMock.mockResolvedValue(false);

    const result = await createEntityCommand(entityRepository, kindRepository, tagRepository, {
      kindId: 1,
      name: "DDD",
      description: "",
      isWishlist: false,
      tagIds: [10]
    });

    expect(result).toEqual({
      ok: false,
      status: 500,
      message: "failed to insert entity with tags"
    });
    randomUUIDSpy.mockRestore();
  });

  it("createEntityCommand returns 400 when kind does not exist", async () => {
    findKindByIdMock.mockResolvedValue(null);

    const result = await createEntityCommand(entityRepository, kindRepository, tagRepository, {
      kindId: 999,
      name: "DDD",
      description: "",
      isWishlist: false,
      tagIds: []
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "kind not found"
    });
  });

  it("createEntityCommand returns 400 when location is sent for non-location kind", async () => {
    findKindByIdMock.mockResolvedValue({ id: 2, label: "商品" } as any);

    const result = await createEntityCommand(entityRepository, kindRepository, tagRepository, {
      kindId: 2,
      name: "DDD",
      description: "",
      isWishlist: false,
      tagIds: [],
      latitude: 35.68,
      longitude: 139.77
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "latitude and longitude are allowed only for location kind"
    });
    expect(insertEntityWithTagsMock).not.toHaveBeenCalled();
  });

  it("updateEntityCommand returns conflict when another entity has same kind/name", async () => {
    findKindByIdMock.mockResolvedValue({ id: 1, label: "Book" } as any);
    findEntityIdByKindAndNameMock.mockResolvedValue({ id: "entity-other" } as any);

    const result = await updateEntityCommand(entityRepository, kindRepository, tagRepository, "entity-1", {
      kindId: 1,
      name: "DDD",
      description: "",
      isWishlist: false,
      tagIds: []
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "entity already exists"
    });
  });

  it("updateEntityCommand returns 404 when target entity is missing", async () => {
    findKindByIdMock.mockResolvedValue({ id: 1, label: "Book" } as any);
    findEntityIdByKindAndNameMock.mockResolvedValue(null);
    countExistingTagsByIdsMock.mockResolvedValue(0);
    updateEntityWithTagsMock.mockResolvedValue("not_found");

    const result = await updateEntityCommand(entityRepository, kindRepository, tagRepository, "entity-1", {
      kindId: 1,
      name: "DDD",
      description: "",
      isWishlist: false,
      tagIds: []
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "entity not found"
    });
  });

  it("updateEntityCommand returns 400 when location is sent for non-location kind", async () => {
    findKindByIdMock.mockResolvedValue({ id: 2, label: "商品" } as any);

    const result = await updateEntityCommand(entityRepository, kindRepository, tagRepository, "entity-1", {
      kindId: 2,
      name: "DDD",
      description: "",
      isWishlist: false,
      tagIds: [],
      latitude: 35.68,
      longitude: 139.77
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "latitude and longitude are allowed only for location kind"
    });
    expect(updateEntityWithTagsMock).not.toHaveBeenCalled();
  });

  it("updateEntityCommand returns entity after successful update", async () => {
    findKindByIdMock.mockResolvedValue({ id: 1, label: "Book" } as any);
    findEntityIdByKindAndNameMock.mockResolvedValue({ id: "entity-1" } as any);
    countExistingTagsByIdsMock.mockResolvedValue(1);
    updateEntityWithTagsMock.mockResolvedValue("updated");
    fetchEntityWithTagsMock.mockResolvedValue({
      id: "entity-1",
      kind_id: 1,
      name: "DDD",
      description: null,
      is_wishlist: 0,
      tags: [{ id: 10, name: "arch" }],
      created_at: "2026-01-01",
      updated_at: "2026-01-01"
    } as any);

    const result = await updateEntityCommand(entityRepository, kindRepository, tagRepository, "entity-1", {
      kindId: 1,
      name: "DDD",
      description: "",
      isWishlist: false,
      tagIds: [10]
    });

    expect(result).toEqual({
      ok: true,
      data: {
        entity: {
          id: "entity-1",
          kind: { id: 1, label: "Book" },
          name: "DDD",
          description: null,
          is_wishlist: 0,
          tags: [{ id: 10, name: "arch" }],
          created_at: "2026-01-01",
          updated_at: "2026-01-01"
        }
      }
    });
  });
});
