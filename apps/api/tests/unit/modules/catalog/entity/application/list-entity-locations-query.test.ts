import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../src/modules/catalog/entity/infra/entity-repository-d1", () => ({
  listEntityLocationsWithKindsFromD1: vi.fn(),
  fetchTagsByEntityIdsFromD1: vi.fn()
}));

import { listEntityLocationsQuery } from "../../../../../../src/modules/catalog/entity/application/list-entity-locations-query";
import {
  fetchTagsByEntityIdsFromD1,
  listEntityLocationsWithKindsFromD1
} from "../../../../../../src/modules/catalog/entity/infra/entity-repository-d1";

const listEntityLocationsWithKindsFromD1Mock = vi.mocked(listEntityLocationsWithKindsFromD1);
const fetchTagsByEntityIdsFromD1Mock = vi.mocked(fetchTagsByEntityIdsFromD1);

describe("listEntityLocationsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps rows to location DTO", async () => {
    listEntityLocationsWithKindsFromD1Mock.mockResolvedValue([
      {
        id: "entity-1",
        kind_id: 1,
        kind_label: "場所",
        name: "東京駅",
        latitude: 35.681236,
        longitude: 139.767125
      }
    ] as any);
    fetchTagsByEntityIdsFromD1Mock.mockResolvedValue(
      new Map([["entity-1", [{ id: 10, name: "散歩" }]]])
    );

    const result = await listEntityLocationsQuery({} as D1Database);

    expect(result).toEqual({
      ok: true,
      data: {
        locations: [
          {
            id: "entity-1",
            kind: {
              id: 1,
              label: "場所"
            },
            name: "東京駅",
            tags: [{ id: 10, name: "散歩" }],
            location: {
              latitude: 35.681236,
              longitude: 139.767125
            }
          }
        ]
      }
    });
  });
});
