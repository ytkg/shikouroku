import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/modules/catalog/tag/infra/tag-repository-d1", () => ({
  deleteTagWithRelationsFromD1: vi.fn(),
  findTagByNameFromD1: vi.fn(),
  insertTagToD1: vi.fn(),
  listTagsFromD1: vi.fn()
}));

import {
  deleteTagWithRelationsFromD1,
  findTagByNameFromD1,
  insertTagToD1,
  listTagsFromD1
} from "../../../../../../src/modules/catalog/tag/infra/tag-repository-d1";
import { createTagCommand } from "../../../../../../src/modules/catalog/tag/application/create-tag-command";
import { deleteTagCommand } from "../../../../../../src/modules/catalog/tag/application/delete-tag-command";
import { listTagsQuery } from "../../../../../../src/modules/catalog/tag/application/list-tags-query";

const listTagsFromD1Mock = vi.mocked(listTagsFromD1);
const findTagByNameFromD1Mock = vi.mocked(findTagByNameFromD1);
const insertTagToD1Mock = vi.mocked(insertTagToD1);
const deleteTagWithRelationsFromD1Mock = vi.mocked(deleteTagWithRelationsFromD1);

describe("tag module application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listTagsQuery returns tags", async () => {
    const db = {} as D1Database;
    listTagsFromD1Mock.mockResolvedValue([{ id: 1, name: "tech" }]);

    const result = await listTagsQuery(db);

    expect(result).toEqual({
      ok: true,
      data: {
        tags: [{ id: 1, name: "tech" }]
      }
    });
  });

  it("createTagCommand returns conflict when tag already exists", async () => {
    const db = {} as D1Database;
    findTagByNameFromD1Mock.mockResolvedValue({ id: 1, name: "tech" });

    const result = await createTagCommand(db, "tech");

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "tag already exists"
    });
  });

  it("createTagCommand returns created tag on success", async () => {
    const db = {} as D1Database;
    findTagByNameFromD1Mock.mockResolvedValue(null);
    insertTagToD1Mock.mockResolvedValue({ id: 3, name: "book" });

    const result = await createTagCommand(db, "book");

    expect(result).toEqual({
      ok: true,
      data: {
        tag: { id: 3, name: "book" }
      }
    });
  });

  it("deleteTagCommand maps not_found result", async () => {
    const db = {} as D1Database;
    deleteTagWithRelationsFromD1Mock.mockResolvedValue("not_found");

    const result = await deleteTagCommand(db, 999);

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "tag not found"
    });
  });
});
