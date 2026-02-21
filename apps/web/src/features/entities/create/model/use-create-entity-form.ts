import { useEffect, useState } from "react";
import { useAuthGuard } from "@/features/auth";
import type { Entity, Tag } from "@/entities/entity";
import {
  useEntitiesQuery,
  useEntityMutations,
  useKindsQuery,
  useTagsQuery
} from "@/entities/entity";
import {
  addTagId,
  removeTagId,
  toggleTagId
} from "../../shared/model/tag-selection";
import { toggleRelatedEntityId } from "../../shared/model/related-selection";
import { errorMessages } from "@/shared/config/error-messages";
import { ApiError } from "@/shared/api/api-error";
import { toErrorMessage } from "@/shared/lib/error-message";
import { KEEP_CURRENT_ERROR, resolveQueryError } from "@/shared/lib/query-error";

type CreateEntityResult = {
  ensureAuthorized: (status: number) => boolean;
  kinds: { id: number; label: string }[];
  tags: Tag[];
  kindId: string;
  name: string;
  description: string;
  isWishlist: boolean;
  selectedTagIds: number[];
  relatedCandidates: Entity[];
  selectedRelatedEntityIds: string[];
  tagDialogOpen: boolean;
  submitLoading: boolean;
  loading: boolean;
  error: string | null;
  submitResult: Entity | null;
  setKindId: (value: string) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setIsWishlist: (value: boolean) => void;
  setTagDialogOpen: (open: boolean) => void;
  onToggleTag: (tagId: number, checked: boolean) => void;
  onToggleRelatedEntity: (entityId: string, checked: boolean) => void;
  onTagCreated: (tag: Tag) => void;
  onTagDeleted: (tagId: number) => void;
  submit: () => Promise<void>;
};

function toKindId(value: string): number | null {
  const kindId = Number(value);
  if (!Number.isInteger(kindId) || kindId <= 0) {
    return null;
  }
  return kindId;
}

export function useCreateEntityForm(): CreateEntityResult {
  const ensureAuthorized = useAuthGuard();
  const [kindId, setKindId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isWishlist, setIsWishlist] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedRelatedEntityIds, setSelectedRelatedEntityIds] = useState<string[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<Entity | null>(null);
  const { data: kinds = [], error: kindsError, isLoading: kindsLoading } = useKindsQuery();
  const { data: tags = [], error: tagsError, isLoading: tagsLoading } = useTagsQuery();
  const {
    data: relatedCandidates = [],
    error: entitiesError,
    isLoading: entitiesLoading
  } = useEntitiesQuery();
  const { createEntity, createEntityRelation } = useEntityMutations();

  useEffect(() => {
    if (kinds.length === 0 || kindId.length > 0) {
      return;
    }
    setKindId(String(kinds[0].id));
  }, [kinds, kindId]);

  useEffect(() => {
    const nextError = resolveQueryError({
      queryError: kindsError ?? tagsError ?? entitiesError,
      ensureAuthorized
    });
    if (nextError !== KEEP_CURRENT_ERROR) {
      setError(nextError);
    }
  }, [kindsError, tagsError, entitiesError, ensureAuthorized]);

  const onToggleTag = (tagId: number, checked: boolean) => {
    setSelectedTagIds((current) => toggleTagId(current, tagId, checked));
  };

  const onTagCreated = (tag: Tag) => {
    setSelectedTagIds((current) => addTagId(current, tag.id));
  };

  const onTagDeleted = (tagId: number) => {
    setSelectedTagIds((current) => removeTagId(current, tagId));
  };

  const onToggleRelatedEntity = (entityId: string, checked: boolean) => {
    setSelectedRelatedEntityIds((current) => toggleRelatedEntityId(current, entityId, checked));
  };

  const submit = async () => {
    const parsedKindId = toKindId(kindId);
    if (parsedKindId === null) {
      setError(errorMessages.kindRequired);
      return;
    }

    setError(null);
    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      const entity = await createEntity({
        kindId: parsedKindId,
        name,
        description,
        isWishlist,
        tagIds: selectedTagIds
      });

      for (const relatedEntityId of selectedRelatedEntityIds) {
        await createEntityRelation(entity.id, { relatedEntityId });
      }

      setSubmitResult(entity);
      setName("");
      setDescription("");
      setIsWishlist(false);
      setSelectedTagIds([]);
      setSelectedRelatedEntityIds([]);
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(toErrorMessage(e));
    } finally {
      setSubmitLoading(false);
    }
  };

  return {
    ensureAuthorized,
    kinds,
    tags,
    kindId,
    name,
    description,
    isWishlist,
    selectedTagIds,
    relatedCandidates,
    selectedRelatedEntityIds,
    tagDialogOpen,
    submitLoading,
    loading: kindsLoading || tagsLoading || entitiesLoading,
    error,
    submitResult,
    setKindId,
    setName,
    setDescription,
    setIsWishlist,
    setTagDialogOpen,
    onToggleTag,
    onToggleRelatedEntity,
    onTagCreated,
    onTagDeleted,
    submit
  };
}
