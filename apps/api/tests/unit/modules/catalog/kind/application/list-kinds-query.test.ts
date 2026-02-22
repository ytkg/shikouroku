import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/modules/catalog/kind/infra/kind-repository-d1", () => ({
  listKindsFromD1: vi.fn()
}));

import { listKindsFromD1 } from "../../../../../../src/modules/catalog/kind/infra/kind-repository-d1";
import { listKindsQuery } from "../../../../../../src/modules/catalog/kind/application/list-kinds-query";

const listKindsFromD1Mock = vi.mocked(listKindsFromD1);

describe("kind module application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listKindsQuery returns kinds from repository", async () => {
    const db = {} as D1Database;
    listKindsFromD1Mock.mockResolvedValue([
      { id: 1, label: "Book" },
      { id: 2, label: "Movie" }
    ]);

    const result = await listKindsQuery(db);

    expect(result).toEqual({
      ok: true,
      data: {
        kinds: [
          { id: 1, label: "Book" },
          { id: 2, label: "Movie" }
        ]
      }
    });
  });
});
