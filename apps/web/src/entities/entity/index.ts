export type { Entity, Kind, Tag } from "./model";
export {
  ENTITIES_KEY,
  KINDS_KEY,
  TAGS_KEY,
  entityKey,
  isEntityDetailKey,
  isEntityRelatedListKey,
  relatedEntitiesKey,
  useEntitiesQuery,
  useEntityMutations,
  useEntityQuery,
  useKindsQuery,
  useRelatedEntitiesQuery,
  useTagMutations,
  useTagsQuery
} from "./model";
export {
  createEntityRelation,
  deleteEntityRelation,
  fetchEntities,
  fetchEntityById,
  fetchKinds,
  fetchRelatedEntities,
  fetchTags
} from "./api";
