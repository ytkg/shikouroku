import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEntityRelationCommand } from "../../../../../../src/modules/catalog/relation/application/create-entity-relation-command";
import { deleteEntityRelationCommand } from "../../../../../../src/modules/catalog/relation/application/delete-entity-relation-command";
import { listRelatedEntitiesQuery } from "../../../../../../src/modules/catalog/relation/application/list-related-entities-query";
import type { EntityReadRepository } from "../../../../../../src/modules/catalog/entity/ports/entity-read-repository";
import type { RelationRepository } from "../../../../../../src/modules/catalog/relation/ports/relation-repository";

describe("relation module application", () => {
  const findEntityByIdMock = vi.fn();
  const fetchEntitiesWithKindsByIdsMock = vi.fn();
  const fetchTagsByEntityIdsMock = vi.fn();
  const listRelatedEntityIdsMock = vi.fn();
  const createRelationMock = vi.fn();
  const deleteRelationMock = vi.fn();
  const entityReadRepository: EntityReadRepository = {
    findEntityById: findEntityByIdMock,
    fetchEntitiesWithKindsByIds: fetchEntitiesWithKindsByIdsMock,
    fetchTagsByEntityIds: fetchTagsByEntityIdsMock
  };
  const relationRepository: RelationRepository = {
    listRelatedEntityIds: listRelatedEntityIdsMock,
    createRelation: createRelationMock,
    deleteRelation: deleteRelationMock
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listRelatedEntitiesQuery returns 404 when base entity is missing", async () => {
    findEntityByIdMock.mockResolvedValue(null);

    const result = await listRelatedEntitiesQuery(entityReadRepository, relationRepository, "entity-1");

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "entity not found"
    });
  });

  it("listRelatedEntitiesQuery returns mapped related entities", async () => {
    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    listRelatedEntityIdsMock.mockResolvedValue(["entity-2"]);
    fetchEntitiesWithKindsByIdsMock.mockResolvedValue([
      {
        id: "entity-2",
        kind_id: 3,
        kind_label: "Book",
        name: "DDD",
        description: null,
        is_wishlist: 0,
        first_image_id: "img-1",
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

    const result = await listRelatedEntitiesQuery(entityReadRepository, relationRepository, "entity-1");

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
            first_image_url: "/api/entities/entity-2/images/img-1/file",
            created_at: "2026-01-01",
            updated_at: "2026-01-01"
          }
        ]
      }
    });
  });

  it("createEntityRelationCommand rejects self relation", async () => {
    const result = await createEntityRelationCommand(entityReadRepository, relationRepository, "entity-1", "entity-1");

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "self relation is not allowed"
    });
  });

  it("createEntityRelationCommand returns conflict when relation exists", async () => {
    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    createRelationMock.mockResolvedValue("conflict");

    const result = await createEntityRelationCommand(entityReadRepository, relationRepository, "entity-1", "entity-2");

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "relation already exists"
    });
  });

  it("deleteEntityRelationCommand returns not found when relation does not exist", async () => {
    findEntityByIdMock.mockResolvedValue({ id: "entity-1" } as any);
    deleteRelationMock.mockResolvedValue("not_found");

    const result = await deleteEntityRelationCommand(entityReadRepository, relationRepository, "entity-1", "entity-2");

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "relation not found"
    });
  });
});
