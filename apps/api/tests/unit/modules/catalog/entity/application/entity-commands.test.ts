import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/modules/catalog/entity/infra/entity-repository-d1", () => ({
  deleteEntityInD1: vi.fn(),
  fetchEntityWithTagsFromD1: vi.fn(),
  fetchTagsByEntityIdsFromD1: vi.fn(),
  findEntityIdByKindAndNameFromD1: vi.fn(),
  findEntityWithKindByIdFromD1: vi.fn(),
  insertEntityInD1: vi.fn(),
  listEntitiesWithKindsFromD1: vi.fn(),
  replaceEntityTagsInD1: vi.fn(),
  updateEntityInD1: vi.fn()
}));

import { createEntityCommand } from "../../../../../../src/modules/catalog/entity/application/create-entity-command";
import { getEntityQuery } from "../../../../../../src/modules/catalog/entity/application/get-entity-query";
import { listEntitiesQuery } from "../../../../../../src/modules/catalog/entity/application/list-entities-query";
import { updateEntityCommand } from "../../../../../../src/modules/catalog/entity/application/update-entity-command";
import {
  deleteEntityInD1,
  fetchEntityWithTagsFromD1,
  fetchTagsByEntityIdsFromD1,
  findEntityIdByKindAndNameFromD1,
  findEntityWithKindByIdFromD1,
  insertEntityInD1,
  listEntitiesWithKindsFromD1,
  replaceEntityTagsInD1,
  updateEntityInD1
} from "../../../../../../src/modules/catalog/entity/infra/entity-repository-d1";

const findKindByIdMock = vi.fn();
const countExistingTagsByIdsMock = vi.fn();
const deleteEntityInD1Mock = vi.mocked(deleteEntityInD1);
const fetchEntityWithTagsFromD1Mock = vi.mocked(fetchEntityWithTagsFromD1);
const fetchTagsByEntityIdsFromD1Mock = vi.mocked(fetchTagsByEntityIdsFromD1);
const findEntityIdByKindAndNameFromD1Mock = vi.mocked(findEntityIdByKindAndNameFromD1);
const findEntityWithKindByIdFromD1Mock = vi.mocked(findEntityWithKindByIdFromD1);
const insertEntityInD1Mock = vi.mocked(insertEntityInD1);
const listEntitiesWithKindsFromD1Mock = vi.mocked(listEntitiesWithKindsFromD1);
const replaceEntityTagsInD1Mock = vi.mocked(replaceEntityTagsInD1);
const updateEntityInD1Mock = vi.mocked(updateEntityInD1);
const kindRepository = { findKindById: findKindByIdMock };
const tagRepository = { countExistingTagsByIds: countExistingTagsByIdsMock };

describe("entity module application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listEntitiesQuery maps first image url and tags", async () => {
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

    const result = await listEntitiesQuery({} as D1Database);

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
        ]
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

  it("createEntityCommand rolls back entity when tag update fails", async () => {
    const db = {} as D1Database;
    const randomUUIDSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue("entity-new");
    findKindByIdMock.mockResolvedValue({ id: 1, label: "Book" } as any);
    findEntityIdByKindAndNameFromD1Mock.mockResolvedValue(null);
    countExistingTagsByIdsMock.mockResolvedValue(1);
    insertEntityInD1Mock.mockResolvedValue(true);
    replaceEntityTagsInD1Mock.mockResolvedValue(false);

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
      message: "failed to insert entity tags"
    });
    expect(deleteEntityInD1Mock).toHaveBeenCalledWith(db, "entity-new");
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
    updateEntityInD1Mock.mockResolvedValue("not_found");

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
    updateEntityInD1Mock.mockResolvedValue("updated");
    replaceEntityTagsInD1Mock.mockResolvedValue(true);
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
