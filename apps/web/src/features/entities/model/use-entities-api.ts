import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  createEntity as createEntityRequest,
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  fetchEntities,
  fetchEntityById,
  fetchKinds,
  fetchTags,
  updateEntity as updateEntityRequest,
  type CreateEntityInput,
  type CreateTagInput,
  type UpdateEntityInput
} from "@/features/entities/api/entities.client";
import type { Entity, Tag } from "@/features/entities/model/entity-types";

const ENTITIES_KEY = "/api/entities";
const KINDS_KEY = "/api/kinds";
const TAGS_KEY = "/api/tags";

function entityKey(entityId: string): string {
  return `/api/entities/${entityId}`;
}

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

export function useEntityMutations() {
  const { mutate } = useSWRConfig();

  const createEntity = useCallback(
    async (input: CreateEntityInput): Promise<Entity> => {
      const entity = await createEntityRequest(input);
      await Promise.all([
        mutate(ENTITIES_KEY),
        mutate(entityKey(entity.id), entity, false)
      ]);
      return entity;
    },
    [mutate]
  );

  const updateEntity = useCallback(
    async (entityId: string, input: UpdateEntityInput): Promise<Entity> => {
      const entity = await updateEntityRequest(entityId, input);
      await Promise.all([
        mutate(ENTITIES_KEY),
        mutate(entityKey(entityId), entity, false)
      ]);
      return entity;
    },
    [mutate]
  );

  return { createEntity, updateEntity };
}

export function useTagMutations() {
  const { mutate } = useSWRConfig();

  const createTag = useCallback(
    async (input: CreateTagInput): Promise<Tag> => {
      const tag = await createTagRequest(input);
      await mutate(TAGS_KEY);
      return tag;
    },
    [mutate]
  );

  const deleteTag = useCallback(
    async (tagId: number): Promise<void> => {
      await deleteTagRequest(tagId);
      await Promise.all([
        mutate(TAGS_KEY),
        mutate(ENTITIES_KEY),
        mutate((key) => typeof key === "string" && key.startsWith("/api/entities/"))
      ]);
    },
    [mutate]
  );

  return { createTag, deleteTag };
}
