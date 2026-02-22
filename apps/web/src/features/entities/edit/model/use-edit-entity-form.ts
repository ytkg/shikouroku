import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthGuard } from "@/features/auth";
import type { Entity, Kind, Tag } from "@/entities/entity";
import {
  useEntitiesQuery,
  useEntityMutations,
  useEntityQuery,
  useKindsQuery,
  useRelatedEntitiesQuery,
  useTagsQuery
} from "@/entities/entity";
import {
  addTagId,
  removeTagId,
  toggleTagId
} from "../../shared/model/tag-selection";
import {
  diffRelatedEntityIds,
  toggleRelatedEntityId
} from "../../shared/model/related-selection";
import { errorMessages } from "@/shared/config/error-messages";
import { httpStatus } from "@/shared/config/http-status";
import { ApiError } from "@/shared/api/api-error";
import { toErrorMessage } from "@/shared/lib/error-message";
import { KEEP_CURRENT_ERROR, resolveQueryError } from "@/shared/lib/query-error";

type EditEntityResult = {
  ensureAuthorized: (status: number) => boolean;
  entity: Entity | undefined;
  kinds: Kind[];
  tags: Tag[];
  kindId: string;
  name: string;
  description: string;
  isWishlist: boolean;
  selectedTagIds: number[];
  relatedCandidates: Entity[];
  selectedRelatedEntityIds: string[];
  tagDialogOpen: boolean;
  relatedDialogOpen: boolean;
  saving: boolean;
  loading: boolean;
  error: string | null;
  setKindId: (value: string) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setIsWishlist: (value: boolean) => void;
  setTagDialogOpen: (open: boolean) => void;
  setRelatedDialogOpen: (open: boolean) => void;
  onToggleTag: (tagId: number, checked: boolean) => void;
  onToggleRelatedEntity: (entityId: string, checked: boolean) => void;
  onTagCreated: (tag: Tag) => void;
  onTagDeleted: (tagId: number) => void;
  save: () => Promise<boolean>;
};

function toKindId(value: string): number | null {
  const kindId = Number(value);
  if (!Number.isInteger(kindId) || kindId <= 0) {
    return null;
  }
  return kindId;
}

export function useEditEntityForm(entityId: string | undefined): EditEntityResult {
  const ensureAuthorized = useAuthGuard();
  const { data: entity, error: entityError, isLoading: entityLoading } = useEntityQuery(entityId);
  const {
    data: entities = [],
    error: entitiesError,
    isLoading: entitiesLoading
  } = useEntitiesQuery();
  const { data: kinds = [], error: kindsError, isLoading: kindsLoading } = useKindsQuery();
  const { data: tags = [], error: tagsError, isLoading: tagsLoading } = useTagsQuery();
  const {
    data: relatedEntities = [],
    error: relatedError,
    isLoading: relatedLoading
  } = useRelatedEntitiesQuery(entityId);
  const { updateEntity, createEntityRelation, deleteEntityRelation } = useEntityMutations();
  const [error, setError] = useState<string | null>(null);
  const [kindId, setKindId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isWishlist, setIsWishlist] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedRelatedEntityIds, setSelectedRelatedEntityIds] = useState<string[]>([]);
  const [savedRelatedEntityIds, setSavedRelatedEntityIds] = useState<string[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [relatedDialogOpen, setRelatedDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const initializedEntityIdRef = useRef<string | null>(null);

  const relatedCandidates = useMemo(() => {
    const merged = new Map<string, Entity>();
    for (const candidate of entities) {
      if (candidate.id === entityId) {
        continue;
      }
      merged.set(candidate.id, candidate);
    }

    for (const candidate of relatedEntities) {
      if (candidate.id === entityId) {
        continue;
      }
      if (merged.has(candidate.id)) {
        continue;
      }
      merged.set(candidate.id, candidate);
    }

    return Array.from(merged.values());
  }, [entities, relatedEntities, entityId]);

  useEffect(() => {
    initializedEntityIdRef.current = null;
    setSelectedRelatedEntityIds([]);
    setSavedRelatedEntityIds([]);
  }, [entityId]);

  useEffect(() => {
    if (!entity || !entityId || relatedLoading) {
      return;
    }

    if (initializedEntityIdRef.current === entityId) {
      return;
    }

    setKindId(String(entity.kind.id));
    setName(entity.name);
    setDescription(entity.description ?? "");
    setIsWishlist(entity.isWishlist);
    setSelectedTagIds(entity.tags.map((tag) => tag.id));
    const relatedEntityIds = relatedEntities.map((relatedEntity) => relatedEntity.id);
    setSelectedRelatedEntityIds(relatedEntityIds);
    setSavedRelatedEntityIds(relatedEntityIds);
    initializedEntityIdRef.current = entityId;
  }, [entity, entityId, relatedEntities, relatedLoading]);

  useEffect(() => {
    if (!entityId) {
      setError(errorMessages.invalidEntityId);
      return;
    }

    const nextError = resolveQueryError({
      queryError: entityError ?? kindsError ?? tagsError ?? entitiesError ?? relatedError,
      ensureAuthorized,
      notFoundMessage: errorMessages.entityNotFound
    });
    if (nextError !== KEEP_CURRENT_ERROR) {
      setError(nextError);
    }
  }, [entityId, entityError, kindsError, tagsError, entitiesError, relatedError, ensureAuthorized]);

  const onToggleTag = (tagId: number, checked: boolean) => {
    setSelectedTagIds((current) => toggleTagId(current, tagId, checked));
  };

  const onTagCreated = (tag: Tag) => {
    setSelectedTagIds((current) => addTagId(current, tag.id));
  };

  const onTagDeleted = (tagId: number) => {
    setSelectedTagIds((current) => removeTagId(current, tagId));
  };

  const onToggleRelatedEntity = (relatedEntityId: string, checked: boolean) => {
    setSelectedRelatedEntityIds((current) =>
      toggleRelatedEntityId(current, relatedEntityId, checked)
    );
  };

  const save = async (): Promise<boolean> => {
    if (!entityId) {
      return false;
    }

    const parsedKindId = toKindId(kindId);
    if (parsedKindId === null) {
      setError(errorMessages.kindRequired);
      return false;
    }

    setError(null);
    setSaving(true);
    try {
      const updated = await updateEntity(entityId, {
        kindId: parsedKindId,
        name,
        description,
        isWishlist,
        tagIds: selectedTagIds
      });
      setKindId(String(updated.kind.id));
      setName(updated.name);
      setDescription(updated.description ?? "");
      setIsWishlist(updated.isWishlist);
      setSelectedTagIds(updated.tags.map((tag) => tag.id));
      const relationDiff = diffRelatedEntityIds(savedRelatedEntityIds, selectedRelatedEntityIds);

      for (const relatedEntityId of relationDiff.toAdd) {
        try {
          await createEntityRelation(entityId, { relatedEntityId });
        } catch (relationError) {
          if (relationError instanceof ApiError && relationError.status === 409) {
            continue;
          }
          throw relationError;
        }
      }

      for (const relatedEntityId of relationDiff.toRemove) {
        try {
          await deleteEntityRelation(entityId, relatedEntityId);
        } catch (relationError) {
          if (
            relationError instanceof ApiError &&
            relationError.status === httpStatus.notFound
          ) {
            continue;
          }
          throw relationError;
        }
      }

      setSavedRelatedEntityIds([...selectedRelatedEntityIds]);
      return true;
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return false;
      }
      setError(toErrorMessage(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    ensureAuthorized,
    entity,
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
    relatedDialogOpen,
    saving,
    loading:
      Boolean(entityId) &&
      (entityLoading || entitiesLoading || kindsLoading || tagsLoading || relatedLoading),
    error,
    setKindId,
    setName,
    setDescription,
    setIsWishlist,
    setTagDialogOpen,
    setRelatedDialogOpen,
    onToggleTag,
    onToggleRelatedEntity,
    onTagCreated,
    onTagDeleted,
    save
  };
}
