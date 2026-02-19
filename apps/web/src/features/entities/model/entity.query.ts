import useSWR from "swr";
import {
  fetchEntities,
  fetchEntityById,
  fetchKinds,
  fetchTags
} from "@/features/entities/api/entities.client";
import { ENTITIES_KEY, entityKey, KINDS_KEY, TAGS_KEY } from "@/features/entities/model/entity.swr-keys";

export function useEntitiesQuery() {
  return useSWR(ENTITIES_KEY, fetchEntities);
}

export function useEntityQuery(entityId: string | undefined) {
  return useSWR(entityId ? entityKey(entityId) : null, () => fetchEntityById(entityId ?? ""));
}

export function useKindsQuery() {
  return useSWR(KINDS_KEY, fetchKinds);
}

export function useTagsQuery() {
  return useSWR(TAGS_KEY, fetchTags);
}
