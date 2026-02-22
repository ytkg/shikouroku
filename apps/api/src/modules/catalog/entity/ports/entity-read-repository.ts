import type { EntityRecord, EntityWithKindRecord, TagRecord } from "../../../../shared/db/records";

export type EntityReadRepository = {
  findEntityById: (id: string) => Promise<EntityRecord | null>;
  fetchEntitiesWithKindsByIds: (ids: string[]) => Promise<EntityWithKindRecord[]>;
  fetchTagsByEntityIds: (entityIds: string[]) => Promise<Map<string, TagRecord[]>>;
};
