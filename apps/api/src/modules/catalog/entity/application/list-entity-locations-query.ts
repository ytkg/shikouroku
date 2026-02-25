import { success, type UseCaseResult } from "../../../../shared/application/result";
import {
  fetchTagsByEntityIdsFromD1,
  listEntityLocationsWithKindsFromD1
} from "../infra/entity-repository-d1";

type EntityLocationDto = {
  id: string;
  kind: {
    id: number;
    label: string;
  };
  name: string;
  tags: {
    id: number;
    name: string;
  }[];
  location: {
    latitude: number;
    longitude: number;
  };
};

export async function listEntityLocationsQuery(
  db: D1Database
): Promise<UseCaseResult<{ locations: EntityLocationDto[] }>> {
  const rows = await listEntityLocationsWithKindsFromD1(db);
  const tagsByEntity = await fetchTagsByEntityIdsFromD1(
    db,
    rows.map((row) => row.id)
  );
  return success({
    locations: rows.map((row) => ({
      id: row.id,
      kind: {
        id: row.kind_id,
        label: row.kind_label
      },
      name: row.name,
      tags: tagsByEntity.get(row.id) ?? [],
      location: {
        latitude: row.latitude,
        longitude: row.longitude
      }
    }))
  });
}
