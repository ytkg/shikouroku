import { useCallback } from "react";
import { useSWRConfig } from "swr";
import {
  createEntity as createEntityRequest,
  updateEntity as updateEntityRequest,
  type CreateEntityInput,
  type UpdateEntityInput
} from "../api/entities.client";
import { ENTITIES_KEY, entityKey } from "./entity.swr-keys";
import type { Entity } from "./entity.types";

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
