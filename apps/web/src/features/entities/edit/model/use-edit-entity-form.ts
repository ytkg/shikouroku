import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthGuard } from "@/features/auth";
import type { Entity, EntityImage, Kind, Tag } from "@/entities/entity";
import {
  useEntitiesQuery,
  useEntityMutations,
  useEntityImagesQuery,
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
import { notificationMessageKeys } from "@/shared/config/notification-messages";
import { notify } from "@/shared/lib/notify";
import { resolveOperationErrorMessageKey } from "@/shared/lib/notification-error";

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
  images: EntityImage[];
  failedImageFiles: File[];
  tagDialogOpen: boolean;
  relatedDialogOpen: boolean;
  saving: boolean;
  uploadingImages: boolean;
  reorderingImages: boolean;
  deletingImageIds: string[];
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
  onSelectImageFiles: (files: FileList | null) => Promise<void>;
  retryFailedImageUploads: () => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  moveImageUp: (imageId: string) => void;
  moveImageDown: (imageId: string) => void;
  reorderImages: (activeImageId: string, overImageId: string) => void;
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
  const {
    data: images = [],
    error: imagesError,
    isLoading: imagesLoading
  } = useEntityImagesQuery(entityId);
  const {
    updateEntity,
    createEntityRelation,
    deleteEntityRelation,
    uploadEntityImage,
    deleteEntityImage,
    reorderEntityImages
  } = useEntityMutations();
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [reorderingImages, setReorderingImages] = useState(false);
  const [deletingImageIds, setDeletingImageIds] = useState<string[]>([]);
  const [failedImageFiles, setFailedImageFiles] = useState<File[]>([]);
  const [pendingImageOrderIds, setPendingImageOrderIds] = useState<string[] | null>(null);
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
    setFailedImageFiles([]);
    setDeletingImageIds([]);
    setPendingImageOrderIds(null);
  }, [entityId]);

  const serverImageOrderIds = useMemo(() => images.map((image) => image.id), [images]);

  useEffect(() => {
    if (!pendingImageOrderIds) {
      return;
    }

    const imageIdSet = new Set(serverImageOrderIds);
    const normalized = pendingImageOrderIds.filter((imageId) => imageIdSet.has(imageId));
    const normalizedIdSet = new Set(normalized);
    for (const imageId of serverImageOrderIds) {
      if (normalizedIdSet.has(imageId)) {
        continue;
      }
      normalized.push(imageId);
      normalizedIdSet.add(imageId);
    }

    const matchesServer =
      normalized.length === serverImageOrderIds.length &&
      normalized.every((imageId, index) => imageId === serverImageOrderIds[index]);
    if (matchesServer) {
      setPendingImageOrderIds(null);
      return;
    }

    const unchanged =
      normalized.length === pendingImageOrderIds.length &&
      normalized.every((imageId, index) => imageId === pendingImageOrderIds[index]);
    if (!unchanged) {
      setPendingImageOrderIds(normalized);
    }
  }, [pendingImageOrderIds, serverImageOrderIds]);

  const orderedImages = useMemo(() => {
    if (!pendingImageOrderIds) {
      return images;
    }

    const imageById = new Map(images.map((image) => [image.id, image]));
    const ordered: EntityImage[] = [];
    for (const imageId of pendingImageOrderIds) {
      const image = imageById.get(imageId);
      if (image) {
        ordered.push(image);
        imageById.delete(imageId);
      }
    }
    for (const image of images) {
      if (imageById.has(image.id)) {
        ordered.push(image);
      }
    }
    return ordered;
  }, [images, pendingImageOrderIds]);

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
      queryError: entityError ?? kindsError ?? tagsError ?? entitiesError ?? relatedError ?? imagesError,
      ensureAuthorized,
      notFoundMessage: errorMessages.entityNotFound
    });
    if (nextError !== KEEP_CURRENT_ERROR) {
      setError(nextError);
    }
  }, [entityId, entityError, kindsError, tagsError, entitiesError, relatedError, imagesError, ensureAuthorized]);

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

  const uploadImages = async (targetEntityId: string, files: File[]): Promise<File[]> => {
    const failed: File[] = [];

    for (const [index, file] of files.entries()) {
      try {
        await uploadEntityImage(targetEntityId, file);
      } catch (e) {
        if (e instanceof ApiError && !ensureAuthorized(e.status)) {
          failed.push(...files.slice(index));
          break;
        }
        failed.push(file);
      }
    }

    return failed;
  };

  const onSelectImageFiles = async (files: FileList | null): Promise<void> => {
    if (!entityId || !files || files.length === 0) {
      return;
    }

    setUploadingImages(true);
    setError(null);
    try {
      const failedUploads = await uploadImages(entityId, Array.from(files));
      const uploadedCount = files.length - failedUploads.length;
      if (uploadedCount > 0) {
        notify({
          type: "success",
          messageKey: notificationMessageKeys.imageAddSuccess
        });
      }
      setFailedImageFiles((current) => [...current, ...failedUploads]);
      if (failedUploads.length > 0) {
        setError(`${failedUploads.length}件の画像アップロードに失敗しました。再試行してください。`);
        notify({
          type: "error",
          messageKey: notificationMessageKeys.commonSaveError
        });
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const retryFailedImageUploads = async (): Promise<void> => {
    if (!entityId || failedImageFiles.length === 0) {
      return;
    }

    setUploadingImages(true);
    try {
      const failedUploads = await uploadImages(entityId, failedImageFiles);
      setFailedImageFiles(failedUploads);
      if (failedUploads.length === 0) {
        setError(null);
      } else {
        setError(`${failedUploads.length}件の画像アップロードに失敗しました。再試行してください。`);
        notify({
          type: "error",
          messageKey: notificationMessageKeys.commonSaveError
        });
      }
      if (failedImageFiles.length - failedUploads.length > 0) {
        notify({
          type: "success",
          messageKey: notificationMessageKeys.imageAddSuccess
        });
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const deleteImage = async (imageId: string): Promise<void> => {
    if (!entityId) {
      return;
    }

    setDeletingImageIds((current) => [...current, imageId]);
    setError(null);
    try {
      await deleteEntityImage(entityId, imageId);
      notify({
        type: "success",
        messageKey: notificationMessageKeys.imageRemoveSuccess
      });
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(toErrorMessage(e));
      notify({
        type: "error",
        messageKey: resolveOperationErrorMessageKey(e, "delete")
      });
    } finally {
      setDeletingImageIds((current) => current.filter((id) => id !== imageId));
    }
  };

  const applyPendingImageOrder = (orderedImageIds: string[]) => {
    const normalized = [...orderedImageIds];
    const serverIdSet = new Set(serverImageOrderIds);
    for (const imageId of serverImageOrderIds) {
      if (normalized.includes(imageId)) {
        continue;
      }
      normalized.push(imageId);
    }

    const onlyKnownIds = normalized.filter((imageId) => serverIdSet.has(imageId));
    const matchesServer =
      onlyKnownIds.length === serverImageOrderIds.length &&
      onlyKnownIds.every((imageId, index) => imageId === serverImageOrderIds[index]);
    if (matchesServer) {
      setPendingImageOrderIds(null);
      return;
    }

    setPendingImageOrderIds(onlyKnownIds);
  };

  const reorderByDelta = (imageId: string, delta: -1 | 1): void => {
    if (!entityId || orderedImages.length === 0) {
      return;
    }

    const fromIndex = orderedImages.findIndex((image) => image.id === imageId);
    if (fromIndex < 0) {
      return;
    }

    const toIndex = fromIndex + delta;
    if (toIndex < 0 || toIndex >= images.length) {
      return;
    }

    const reorderedIds = orderedImages.map((image) => image.id);
    const [moved] = reorderedIds.splice(fromIndex, 1);
    if (!moved) {
      return;
    }
    reorderedIds.splice(toIndex, 0, moved);
    applyPendingImageOrder(reorderedIds);
  };

  const moveImageUp = (imageId: string): void => {
    reorderByDelta(imageId, -1);
  };

  const moveImageDown = (imageId: string): void => {
    reorderByDelta(imageId, 1);
  };

  const reorderImages = (activeImageId: string, overImageId: string): void => {
    if (!entityId || activeImageId === overImageId || orderedImages.length === 0) {
      return;
    }

    const currentOrder = orderedImages.map((image) => image.id);
    const fromIndex = currentOrder.indexOf(activeImageId);
    const toIndex = currentOrder.indexOf(overImageId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(fromIndex, 1);
    if (!moved) {
      return;
    }
    nextOrder.splice(toIndex, 0, moved);
    applyPendingImageOrder(nextOrder);
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

      if (pendingImageOrderIds) {
        setReorderingImages(true);
        try {
          await reorderEntityImages(entityId, {
            orderedImageIds: pendingImageOrderIds
          });
          setPendingImageOrderIds(null);
        } finally {
          setReorderingImages(false);
        }
      }

      setSavedRelatedEntityIds([...selectedRelatedEntityIds]);
      if (relationDiff.toAdd.length > 0) {
        notify({
          type: "success",
          messageKey: notificationMessageKeys.relationAddSuccess
        });
      }
      if (relationDiff.toRemove.length > 0) {
        notify({
          type: "success",
          messageKey: notificationMessageKeys.relationRemoveSuccess
        });
      }
      notify({
        type: "success",
        messageKey: notificationMessageKeys.entryUpdateSuccess
      });
      return true;
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return false;
      }
      setError(toErrorMessage(e));
      notify({
        type: "error",
        messageKey: resolveOperationErrorMessageKey(e, "save")
      });
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
    images: orderedImages,
    failedImageFiles,
    tagDialogOpen,
    relatedDialogOpen,
    saving,
    uploadingImages,
    reorderingImages,
    deletingImageIds,
    loading:
      Boolean(entityId) &&
      (entityLoading || entitiesLoading || kindsLoading || tagsLoading || relatedLoading || imagesLoading),
    error,
    setKindId,
    setName,
    setDescription,
    setIsWishlist,
    setTagDialogOpen,
    setRelatedDialogOpen,
    onToggleTag,
    onToggleRelatedEntity,
    onSelectImageFiles,
    retryFailedImageUploads,
    deleteImage,
    moveImageUp,
    moveImageDown,
    reorderImages,
    onTagCreated,
    onTagDeleted,
    save
  };
}
