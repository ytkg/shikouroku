import { useCallback } from "react";
import { useSWRConfig } from "swr";
import {
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  type CreateTagInput
} from "@/features/entities/api/entities.client";
import {
  ENTITIES_KEY,
  isEntityDetailKey,
  TAGS_KEY
} from "@/features/entities/model/entity.swr-keys";
import type { Tag } from "@/features/entities/model/entity-types";

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
        mutate((key) => isEntityDetailKey(key))
      ]);
    },
    [mutate]
  );

  return { createTag, deleteTag };
}
