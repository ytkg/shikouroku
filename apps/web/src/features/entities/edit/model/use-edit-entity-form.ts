import { useEffect, useRef, useState } from "react";
import { useAuthGuard } from "@/features/auth";
import type { Entity, Kind, Tag } from "@/entities/entity";
import { useEntityMutations, useEntityQuery, useKindsQuery, useTagsQuery } from "@/entities/entity";
import {
  addTagId,
  removeTagId,
  toggleTagId
} from "../../shared/model/tag-selection";
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
  tagDialogOpen: boolean;
  saving: boolean;
  loading: boolean;
  error: string | null;
  setKindId: (value: string) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setIsWishlist: (value: boolean) => void;
  setTagDialogOpen: (open: boolean) => void;
  onToggleTag: (tagId: number, checked: boolean) => void;
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
  const { data: kinds = [], error: kindsError, isLoading: kindsLoading } = useKindsQuery();
  const { data: tags = [], error: tagsError, isLoading: tagsLoading } = useTagsQuery();
  const { updateEntity } = useEntityMutations();
  const [error, setError] = useState<string | null>(null);
  const [kindId, setKindId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isWishlist, setIsWishlist] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const initializedEntityIdRef = useRef<string | null>(null);

  useEffect(() => {
    initializedEntityIdRef.current = null;
  }, [entityId]);

  useEffect(() => {
    if (!entity || !entityId) {
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
    initializedEntityIdRef.current = entityId;
  }, [entity, entityId]);

  useEffect(() => {
    if (!entityId) {
      setError("嗜好 ID が不正です");
      return;
    }

    const nextError = resolveQueryError({
      queryError: entityError ?? kindsError ?? tagsError,
      ensureAuthorized,
      notFoundMessage: "データが見つかりませんでした"
    });
    if (nextError !== KEEP_CURRENT_ERROR) {
      setError(nextError);
    }
  }, [entityId, entityError, kindsError, tagsError, ensureAuthorized]);

  const onToggleTag = (tagId: number, checked: boolean) => {
    setSelectedTagIds((current) => toggleTagId(current, tagId, checked));
  };

  const onTagCreated = (tag: Tag) => {
    setSelectedTagIds((current) => addTagId(current, tag.id));
  };

  const onTagDeleted = (tagId: number) => {
    setSelectedTagIds((current) => removeTagId(current, tagId));
  };

  const save = async (): Promise<boolean> => {
    if (!entityId) {
      return false;
    }

    const parsedKindId = toKindId(kindId);
    if (parsedKindId === null) {
      setError("種別を選択してください");
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
    tagDialogOpen,
    saving,
    loading: Boolean(entityId) && (entityLoading || kindsLoading || tagsLoading),
    error,
    setKindId,
    setName,
    setDescription,
    setIsWishlist,
    setTagDialogOpen,
    onToggleTag,
    onTagCreated,
    onTagDeleted,
    save
  };
}
