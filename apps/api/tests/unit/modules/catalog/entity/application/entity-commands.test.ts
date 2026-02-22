import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/repositories/kind-repository", () => ({
  findKindById: vi.fn()
}));

vi.mock("../../../../../../src/repositories/tag-repository", () => ({
  countExistingTagsByIds: vi.fn()
}));

vi.mock("../../../../../../src/repositories/entity-repository", () => ({
  deleteEntity: vi.fn(),
  fetchEntityWithTags: vi.fn(),
  fetchTagsByEntityIds: vi.fn(),
  findEntityIdByKindAndName: vi.fn(),
  findEntityWithKindById: vi.fn(),
  insertEntity: vi.fn(),
  listEntitiesWithKinds: vi.fn(),
  replaceEntityTags: vi.fn(),
  updateEntity: vi.fn()
}));

import { findKindById } from "../../../../../../src/repositories/kind-repository";
import { countExistingTagsByIds } from "../../../../../../src/repositories/tag-repository";
import {
  deleteEntity,
  fetchEntityWithTags,
  fetchTagsByEntityIds,
  findEntityIdByKindAndName,
  findEntityWithKindById,
  insertEntity,
  listEntitiesWithKinds,
  replaceEntityTags,
  updateEntity
} from "../../../../../../src/repositories/entity-repository";
import { createEntityCommand } from "../../../../../../src/modules/catalog/entity/application/create-entity-command";
import { getEntityQuery } from "../../../../../../src/modules/catalog/entity/application/get-entity-query";
import { listEntitiesQuery } from "../../../../../../src/modules/catalog/entity/application/list-entities-query";
import { updateEntityCommand } from "../../../../../../src/modules/catalog/entity/application/update-entity-command";

const findKindByIdMock = vi.mocked(findKindById);
const countExistingTagsByIdsMock = vi.mocked(countExistingTagsByIds);
const deleteEntityMock = vi.mocked(deleteEntity);
const fetchEntityWithTagsMock = vi.mocked(fetchEntityWithTags);
const fetchTagsByEntityIdsMock = vi.mocked(fetchTagsByEntityIds);
const findEntityIdByKindAndNameMock = vi.mocked(findEntityIdByKindAndName);
const findEntityWithKindByIdMock = vi.mocked(findEntityWithKindById);
const insertEntityMock = vi.mocked(insertEntity);
const listEntitiesWithKindsMock = vi.mocked(listEntitiesWithKinds);
const replaceEntityTagsMock = vi.mocked(replaceEntityTags);
const updateEntityMock = vi.mocked(updateEntity);

describe("entity module application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listEntitiesQuery maps first image url and tags", async () => {
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
    findEntityWithKindByIdMock.mockResolvedValue(null);

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
    findEntityIdByKindAndNameMock.mockResolvedValue(null);
    countExistingTagsByIdsMock.mockResolvedValue(1);
    insertEntityMock.mockResolvedValue(true);
    replaceEntityTagsMock.mockResolvedValue(false);

    const result = await createEntityCommand(db, {
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
    expect(deleteEntityMock).toHaveBeenCalledWith(db, "entity-new");
    randomUUIDSpy.mockRestore();
  });

  it("createEntityCommand returns 400 when kind does not exist", async () => {
    findKindByIdMock.mockResolvedValue(null);

    const result = await createEntityCommand({} as D1Database, {
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
    findEntityIdByKindAndNameMock.mockResolvedValue({ id: "entity-other" } as any);

    const result = await updateEntityCommand({} as D1Database, "entity-1", {
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
    updateEntityMock.mockResolvedValue("not_found");

    const result = await updateEntityCommand({} as D1Database, "entity-1", {
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
    findEntityIdByKindAndNameMock.mockResolvedValue({ id: "entity-1" } as any);
    countExistingTagsByIdsMock.mockResolvedValue(1);
    updateEntityMock.mockResolvedValue("updated");
    replaceEntityTagsMock.mockResolvedValue(true);
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

    const result = await updateEntityCommand({} as D1Database, "entity-1", {
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
