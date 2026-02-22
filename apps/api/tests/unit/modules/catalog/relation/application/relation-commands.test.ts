import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/repositories/entity-repository", () => ({
  fetchEntitiesWithKindsByIds: vi.fn(),
  fetchTagsByEntityIds: vi.fn(),
  findEntityById: vi.fn()
}));

vi.mock("../../../../../../src/modules/catalog/relation/infra/relation-repository-d1", () => ({
  createRelationInD1: vi.fn(),
  deleteRelationInD1: vi.fn(),
  listRelatedEntityIdsFromD1: vi.fn()
}));

import {
  fetchEntitiesWithKindsByIds,
  fetchTagsByEntityIds,
  findEntityById
} from "../../../../../../src/repositories/entity-repository";
import {
  createRelationInD1,
  deleteRelationInD1,
  listRelatedEntityIdsFromD1
} from "../../../../../../src/modules/catalog/relation/infra/relation-repository-d1";
import { createEntityRelationCommand } from "../../../../../../src/modules/catalog/relation/application/create-entity-relation-command";
import { deleteEntityRelationCommand } from "../../../../../../src/modules/catalog/relation/application/delete-entity-relation-command";
import { listRelatedEntitiesQuery } from "../../../../../../src/modules/catalog/relation/application/list-related-entities-query";

const findEntityByIdMock = vi.mocked(findEntityById);
const listRelatedEntityIdsFromD1Mock = vi.mocked(listRelatedEntityIdsFromD1);
const fetchEntitiesWithKindsByIdsMock = vi.mocked(fetchEntitiesWithKindsByIds);
const fetchTagsByEntityIdsMock = vi.mocked(fetchTagsByEntityIds);
const createRelationInD1Mock = vi.mocked(createRelationInD1);
const deleteRelationInD1Mock = vi.mocked(deleteRelationInD1);

describe("relation module application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listRelatedEntitiesQuery returns 404 when base entity is missing", async () => {
    findEntityByIdMock.mockResolvedValue(null);

    const result = await listRelatedEntitiesQuery({} as D1Database, "entity-1");

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "entity not found"
    });
  });

  it("listRelatedEntitiesQuery returns mapped related entities", async () => {
    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    listRelatedEntityIdsFromD1Mock.mockResolvedValue(["entity-2"]);
    fetchEntitiesWithKindsByIdsMock.mockResolvedValue([
      {
        id: "entity-2",
        kind_id: 3,
        kind_label: "Book",
        name: "DDD",
        description: null,
        is_wishlist: 0,
        created_at: "2026-01-01",
        updated_at: "2026-01-01"
      }
    ] as any);
    fetchTagsByEntityIdsMock.mockResolvedValue(
      new Map([
        [
          "entity-2",
          [
            { id: 10, name: "architecture" },
            { id: 11, name: "design" }
          ]
        ]
      ])
    );

    const result = await listRelatedEntitiesQuery({} as D1Database, "entity-1");

    expect(result).toEqual({
      ok: true,
      data: {
        related: [
          {
            id: "entity-2",
            kind: { id: 3, label: "Book" },
            name: "DDD",
            description: null,
            is_wishlist: 0,
            tags: [
              { id: 10, name: "architecture" },
              { id: 11, name: "design" }
            ],
            created_at: "2026-01-01",
            updated_at: "2026-01-01"
          }
        ]
      }
    });
  });

  it("createEntityRelationCommand rejects self relation", async () => {
    const result = await createEntityRelationCommand({} as D1Database, "entity-1", "entity-1");

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "self relation is not allowed"
    });
  });

  it("createEntityRelationCommand returns conflict when relation exists", async () => {
    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    createRelationInD1Mock.mockResolvedValue("conflict");

    const result = await createEntityRelationCommand({} as D1Database, "entity-1", "entity-2");

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "relation already exists"
    });
  });

  it("deleteEntityRelationCommand returns not found when relation does not exist", async () => {
    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    deleteRelationInD1Mock.mockResolvedValue("not_found");

    const result = await deleteEntityRelationCommand({} as D1Database, "entity-1", "entity-2");

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "relation not found"
    });
  });
});
