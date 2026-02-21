export type { Entity, Kind, Tag } from "./model";
export {
  ENTITIES_KEY,
  KINDS_KEY,
  TAGS_KEY,
  entityKey,
  isEntityDetailKey,
  useEntitiesQuery,
  useEntityMutations,
  useEntityQuery,
  useKindsQuery,
  useTagMutations,
  useTagsQuery
} from "./model";
export { fetchEntities, fetchEntityById, fetchKinds, fetchTags } from "./api";
