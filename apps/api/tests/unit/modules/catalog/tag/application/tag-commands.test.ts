import { describe, expect, it, vi } from "vitest";
import { createTagCommand } from "../../../../../../src/modules/catalog/tag/application/create-tag-command";
import { deleteTagCommand } from "../../../../../../src/modules/catalog/tag/application/delete-tag-command";
import { listTagsQuery } from "../../../../../../src/modules/catalog/tag/application/list-tags-query";
import type { TagRepository } from "../../../../../../src/modules/catalog/tag/ports/tag-repository";

describe("tag module application", () => {
  function createRepositoryMock(overrides: Partial<TagRepository> = {}): TagRepository {
    return {
      listTags: vi.fn().mockResolvedValue([]),
      findTagByName: vi.fn().mockResolvedValue(null),
      insertTag: vi.fn().mockResolvedValue(null),
      deleteTagWithRelations: vi.fn().mockResolvedValue("deleted"),
      countExistingTagsByIds: vi.fn().mockResolvedValue(0),
      ...overrides
    };
  }

  it("listTagsQuery returns tags", async () => {
    const repository = createRepositoryMock({
      listTags: vi.fn().mockResolvedValue([{ id: 1, name: "tech" }])
    });

    const result = await listTagsQuery(repository);

    expect(result).toEqual({
      ok: true,
      data: {
        tags: [{ id: 1, name: "tech" }]
      }
    });
  });

  it("createTagCommand returns conflict when tag already exists", async () => {
    const repository = createRepositoryMock({
      findTagByName: vi.fn().mockResolvedValue({ id: 1, name: "tech" })
    });

    const result = await createTagCommand(repository, "tech");

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "tag already exists"
    });
  });

  it("createTagCommand returns created tag on success", async () => {
    const repository = createRepositoryMock({
      findTagByName: vi.fn().mockResolvedValue(null),
      insertTag: vi.fn().mockResolvedValue({ id: 3, name: "book" })
    });

    const result = await createTagCommand(repository, "book");

    expect(result).toEqual({
      ok: true,
      data: {
        tag: { id: 3, name: "book" }
      }
    });
  });

  it("deleteTagCommand maps not_found result", async () => {
    const repository = createRepositoryMock({
      deleteTagWithRelations: vi.fn().mockResolvedValue("not_found")
    });

    const result = await deleteTagCommand(repository, 999);

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "tag not found"
    });
  });
});
