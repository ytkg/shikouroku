import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/modules/catalog/entity/infra/entity-repository-d1", () => ({
  countEntitiesWithKindsFromD1: vi.fn(),
  fetchEntityWithTagsFromD1: vi.fn(),
  fetchTagsByEntityIdsFromD1: vi.fn(),
  findEntityIdByKindAndNameFromD1: vi.fn(),
  findEntityWithKindByIdFromD1: vi.fn(),
  insertEntityWithTagsInD1: vi.fn(),
  listEntitiesWithKindsFromD1: vi.fn(),
  updateEntityWithTagsInD1: vi.fn()
}));

import { createEntityCommand } from "../../../../../../src/modules/catalog/entity/application/create-entity-command";
import { getEntityQuery } from "../../../../../../src/modules/catalog/entity/application/get-entity-query";
import { listEntitiesQuery } from "../../../../../../src/modules/catalog/entity/application/list-entities-query";
import { updateEntityCommand } from "../../../../../../src/modules/catalog/entity/application/update-entity-command";
import {
  countEntitiesWithKindsFromD1,
  fetchEntityWithTagsFromD1,
  fetchTagsByEntityIdsFromD1,
  findEntityIdByKindAndNameFromD1,
  findEntityWithKindByIdFromD1,
  insertEntityWithTagsInD1,
  listEntitiesWithKindsFromD1,
  updateEntityWithTagsInD1
} from "../../../../../../src/modules/catalog/entity/infra/entity-repository-d1";

const findKindByIdMock = vi.fn();
const countExistingTagsByIdsMock = vi.fn();
const countEntitiesWithKindsFromD1Mock = vi.mocked(countEntitiesWithKindsFromD1);
const fetchEntityWithTagsFromD1Mock = vi.mocked(fetchEntityWithTagsFromD1);
const fetchTagsByEntityIdsFromD1Mock = vi.mocked(fetchTagsByEntityIdsFromD1);
const findEntityIdByKindAndNameFromD1Mock = vi.mocked(findEntityIdByKindAndNameFromD1);
const findEntityWithKindByIdFromD1Mock = vi.mocked(findEntityWithKindByIdFromD1);
const insertEntityWithTagsInD1Mock = vi.mocked(insertEntityWithTagsInD1);
const listEntitiesWithKindsFromD1Mock = vi.mocked(listEntitiesWithKindsFromD1);
const updateEntityWithTagsInD1Mock = vi.mocked(updateEntityWithTagsInD1);
const kindRepository = { findKindById: findKindByIdMock };
const tagRepository = { countExistingTagsByIds: countExistingTagsByIdsMock };

describe("entity module application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listEntitiesQuery maps first image url and tags with page metadata", async () => {
    countEntitiesWithKindsFromD1Mock.mockResolvedValue(1);
    listEntitiesWithKindsFromD1Mock.mockResolvedValue([
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
    fetchTagsByEntityIdsFromD1Mock.mockResolvedValue(new Map([["entity-1", [{ id: 10, name: "arch" }]]]));

    const result = await listEntitiesQuery({} as D1Database, {
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
    findEntityWithKindByIdFromD1Mock.mockResolvedValue(null);

    const result = await getEntityQuery({} as D1Database, "entity-1");

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "entity not found"
    });
  });

  it("createEntityCommand returns failure when entity/tag batch insert fails", async () => {
    const db = {} as D1Database;
    const randomUUIDSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue("entity-new");
    findKindByIdMock.mockResolvedValue({ id: 1, label: "Book" } as any);
    findEntityIdByKindAndNameFromD1Mock.mockResolvedValue(null);
    countExistingTagsByIdsMock.mockResolvedValue(1);
    insertEntityWithTagsInD1Mock.mockResolvedValue(false);

    const result = await createEntityCommand(db, kindRepository, tagRepository, {
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

    const result = await createEntityCommand({} as D1Database, kindRepository, tagRepository, {
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

  it("updateEntityCommand returns conflict when another entity has same kind/name", async () => {
    findKindByIdMock.mockResolvedValue({ id: 1, label: "Book" } as any);
    findEntityIdByKindAndNameFromD1Mock.mockResolvedValue({ id: "entity-other" } as any);

    const result = await updateEntityCommand({} as D1Database, kindRepository, tagRepository, "entity-1", {
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
    findEntityIdByKindAndNameFromD1Mock.mockResolvedValue(null);
    countExistingTagsByIdsMock.mockResolvedValue(0);
    updateEntityWithTagsInD1Mock.mockResolvedValue("not_found");

    const result = await updateEntityCommand({} as D1Database, kindRepository, tagRepository, "entity-1", {
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

  it("updateEntityCommand returns entity after successful update", async () => {
    findKindByIdMock.mockResolvedValue({ id: 1, label: "Book" } as any);
    findEntityIdByKindAndNameFromD1Mock.mockResolvedValue({ id: "entity-1" } as any);
    countExistingTagsByIdsMock.mockResolvedValue(1);
    updateEntityWithTagsInD1Mock.mockResolvedValue("updated");
    fetchEntityWithTagsFromD1Mock.mockResolvedValue({
      id: "entity-1",
      kind_id: 1,
      name: "DDD",
      description: null,
      is_wishlist: 0,
      tags: [{ id: 10, name: "arch" }],
      created_at: "2026-01-01",
      updated_at: "2026-01-01"
    } as any);

    const result = await updateEntityCommand({} as D1Database, kindRepository, tagRepository, "entity-1", {
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
