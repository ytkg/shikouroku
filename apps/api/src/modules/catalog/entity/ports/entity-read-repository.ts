import type { EntityRecord, EntityWithKindAndFirstImageRecord, TagRecord } from "../../../../shared/db/records";

export type EntityReadRepository = {
  findEntityById: (id: string) => Promise<EntityRecord | null>;
  fetchEntitiesWithKindsByIds: (ids: string[]) => Promise<EntityWithKindAndFirstImageRecord[]>;
  fetchTagsByEntityIds: (entityIds: string[]) => Promise<Map<string, TagRecord[]>>;
};
