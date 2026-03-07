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
import { toErrorMessage } from "@/shared/lib/error-message";
import { applyResolvedQueryError, shouldKeepCurrentError } from "@/shared/lib/query-error";
import {
  notificationMessageKeys
} from "@/shared/config/notification-messages";
import { notify } from "@/shared/lib/notify";
import { resolveOperationErrorMessageKey } from "@/shared/lib/notification-error";
import {
  classifyImageFailureReason,
  createProcessingImageOperationStatus,
  finalizeImageOperationStatus,
  idleImageOperationStatus,
  type ImageFailureReason,
  type ImageOperationStatus,
  updateProcessingImageOperationStatus
} from "../../shared/model/image-operation-status";

type CreateEntityResult = {
  ensureAuthorized: (status: number) => boolean;
  kinds: { id: number; label: string }[];
  tags: Tag[];
  kindId: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  isWishlist: boolean;
  selectedTagIds: number[];
  relatedCandidates: Entity[];
  selectedRelatedEntityIds: string[];
  selectedImageFiles: File[];
  failedImageFiles: File[];
  tagDialogOpen: boolean;
  relatedDialogOpen: boolean;
  submitLoading: boolean;
  retryingFailedImages: boolean;
  imageOperationStatus: ImageOperationStatus;
  loading: boolean;
  error: string | null;
  setKindId: (value: string) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setLatitude: (value: string) => void;
  setLongitude: (value: string) => void;
  setIsWishlist: (value: boolean) => void;
  setTagDialogOpen: (open: boolean) => void;
  setRelatedDialogOpen: (open: boolean) => void;
  onToggleTag: (tagId: number, checked: boolean) => void;
  onToggleRelatedEntity: (entityId: string, checked: boolean) => void;
  onSelectImageFiles: (files: File[]) => void;
  onRemoveSelectedImage: (index: number) => void;
  retryFailedImageUploads: () => Promise<void>;
  onTagCreated: (tag: Tag) => void;
  onTagDeleted: (tagId: number) => void;
  submit: () => Promise<string | null>;
};

function toKindId(value: string): number | null {
  const kindId = Number(value);
  if (!Number.isInteger(kindId) || kindId <= 0) {
    return null;
  }
  return kindId;
}

const LOCATION_KIND_LABEL = "場所";

type LocationInputResult =
  | { ok: true; location: { latitude: number; longitude: number } | null }
  | { ok: false; message: string };

function toCoordinate(value: string): number | null {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  const coordinate = Number.parseFloat(normalized);
  if (!Number.isFinite(coordinate)) {
    return null;
  }

  return coordinate;
}

function parseLocationInput(latitude: string, longitude: string): LocationInputResult {
  const hasLatitude = latitude.trim().length > 0;
  const hasLongitude = longitude.trim().length > 0;
  if (!hasLatitude && !hasLongitude) {
    return { ok: true, location: null };
  }
  if (!hasLatitude || !hasLongitude) {
    return { ok: false, message: "緯度と経度は両方入力してください。" };
  }

  const parsedLatitude = toCoordinate(latitude);
  const parsedLongitude = toCoordinate(longitude);
  if (parsedLatitude === null || parsedLongitude === null) {
    return { ok: false, message: "緯度と経度は数値で入力してください。" };
  }
  if (parsedLatitude < -90 || parsedLatitude > 90) {
    return { ok: false, message: "緯度は -90 から 90 の範囲で入力してください。" };
  }
  if (parsedLongitude < -180 || parsedLongitude > 180) {
    return { ok: false, message: "経度は -180 から 180 の範囲で入力してください。" };
  }

  return {
    ok: true,
    location: {
      latitude: parsedLatitude,
      longitude: parsedLongitude
    }
  };
}

export function useCreateEntityForm(): CreateEntityResult {
  const ensureAuthorized = useAuthGuard();
  const [kindId, setKindId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isWishlist, setIsWishlist] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedRelatedEntityIds, setSelectedRelatedEntityIds] = useState<string[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [failedImageFiles, setFailedImageFiles] = useState<File[]>([]);
  const [imageRetryEntityId, setImageRetryEntityId] = useState<string | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [relatedDialogOpen, setRelatedDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [retryingFailedImages, setRetryingFailedImages] = useState(false);
  const [imageOperationStatus, setImageOperationStatus] = useState<ImageOperationStatus>(idleImageOperationStatus);
  const [error, setError] = useState<string | null>(null);
  const { data: kinds = [], error: kindsError, isLoading: kindsLoading } = useKindsQuery();
  const { data: tags = [], error: tagsError, isLoading: tagsLoading } = useTagsQuery();
  const {
    data: relatedCandidates = [],
    error: entitiesError,
    isLoading: entitiesLoading
  } = useEntitiesQuery();
  const { createEntity, createEntityRelation, uploadEntityImage } = useEntityMutations();

  useEffect(() => {
    if (kinds.length === 0 || kindId.length > 0) {
      return;
    }
    setKindId(String(kinds[0].id));
  }, [kinds, kindId]);

  useEffect(() => {
    applyResolvedQueryError(setError, {
      queryError: kindsError ?? tagsError ?? entitiesError,
      ensureAuthorized
    });
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

  const onSelectImageFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    setSelectedImageFiles((current) => [...current, ...files]);
  };

  const onRemoveSelectedImage = (index: number) => {
    setSelectedImageFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setFailedImageFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const uploadImages = async (
    entityId: string,
    files: File[],
    operation: "upload" | "retry"
  ): Promise<{ failedFiles: File[]; failureReasons: ImageFailureReason[] }> => {
    const failed: File[] = [];
    const failureReasons: ImageFailureReason[] = [];
    let successCount = 0;

    for (const [index, file] of files.entries()) {
      try {
        await uploadEntityImage(entityId, file);
        successCount += 1;
        setImageOperationStatus(
          updateProcessingImageOperationStatus({
            lastOperation: operation,
            successCount,
            failedCount: failed.length,
            totalCount: files.length
          })
        );
      } catch (e) {
        const reason = classifyImageFailureReason(e);
        if (shouldKeepCurrentError(e, ensureAuthorized)) {
          const pending = files.slice(index);
          failed.push(...pending);
          for (let i = 0; i < pending.length; i += 1) {
            failureReasons.push(reason);
          }
          setImageOperationStatus(
            updateProcessingImageOperationStatus({
              lastOperation: operation,
              successCount,
              failedCount: failed.length,
              totalCount: files.length
            })
          );
          break;
        }
        failed.push(file);
        failureReasons.push(reason);
        setImageOperationStatus(
          updateProcessingImageOperationStatus({
            lastOperation: operation,
            successCount,
            failedCount: failed.length,
            totalCount: files.length
          })
        );
      }
    }

    return {
      failedFiles: failed,
      failureReasons
    };
  };

  const submit = async (): Promise<string | null> => {
    const parsedKindId = toKindId(kindId);
    if (parsedKindId === null) {
      setError(errorMessages.kindRequired);
      return null;
    }
    const selectedKind = kinds.find((kind) => kind.id === parsedKindId);
    const isLocationKind = selectedKind?.label === LOCATION_KIND_LABEL;
    const parsedLocation = parseLocationInput(latitude, longitude);
    if (!parsedLocation.ok) {
      setError(parsedLocation.message);
      return null;
    }
    if (!isLocationKind && parsedLocation.location) {
      setError("緯度経度は「場所」のときのみ入力できます。");
      return null;
    }

    setError(null);
    setSubmitLoading(true);
    try {
      const entity = await createEntity({
        kindId: parsedKindId,
        name,
        description,
        isWishlist,
        tagIds: selectedTagIds,
        ...(isLocationKind && parsedLocation.location ? parsedLocation.location : {})
      });

      for (const relatedEntityId of selectedRelatedEntityIds) {
        await createEntityRelation(entity.id, { relatedEntityId });
      }
      if (selectedRelatedEntityIds.length > 0) {
        notify({
          type: "success",
          messageKey: notificationMessageKeys.relationAddSuccess
        });
      }

      let failedUploads: File[] = [];
      let uploadedCount = 0;
      if (selectedImageFiles.length > 0) {
        setImageOperationStatus(createProcessingImageOperationStatus("upload", selectedImageFiles.length));
        const uploadResult = await uploadImages(entity.id, selectedImageFiles, "upload");
        failedUploads = uploadResult.failedFiles;
        uploadedCount = selectedImageFiles.length - failedUploads.length;
        setImageOperationStatus(
          finalizeImageOperationStatus({
            lastOperation: "upload",
            successCount: uploadedCount,
            failedCount: failedUploads.length,
            totalCount: selectedImageFiles.length,
            failureReasons: uploadResult.failureReasons
          })
        );
      }
      setImageRetryEntityId(entity.id);
      setFailedImageFiles(failedUploads);
      setSelectedImageFiles(failedUploads);
      if (failedUploads.length > 0) {
        setError(`${failedUploads.length}件の画像アップロードに失敗しました。再試行してください。`);
      }

      setName("");
      setDescription("");
      setLatitude("");
      setLongitude("");
      setIsWishlist(false);
      setSelectedTagIds([]);
      setSelectedRelatedEntityIds([]);
      notify({
        type: "success",
        messageKey: notificationMessageKeys.entryCreateSuccess
      });
      return entity.id;
    } catch (e) {
      if (shouldKeepCurrentError(e, ensureAuthorized)) {
        return null;
      }
      setError(toErrorMessage(e));
      notify({
        type: "error",
        messageKey: resolveOperationErrorMessageKey(e, "save")
      });
      return null;
    } finally {
      setSubmitLoading(false);
    }
  };

  const retryFailedImageUploads = async () => {
    if (!imageRetryEntityId || failedImageFiles.length === 0) {
      return;
    }

    setRetryingFailedImages(true);
    try {
      setImageOperationStatus(createProcessingImageOperationStatus("retry", failedImageFiles.length));
      const { failedFiles: failedUploads, failureReasons } = await uploadImages(
        imageRetryEntityId,
        failedImageFiles,
        "retry"
      );
      setFailedImageFiles(failedUploads);
      setSelectedImageFiles(failedUploads);
      setImageOperationStatus(
        finalizeImageOperationStatus({
          lastOperation: "retry",
          successCount: failedImageFiles.length - failedUploads.length,
          failedCount: failedUploads.length,
          totalCount: failedImageFiles.length,
          failureReasons
        })
      );

      if (failedUploads.length === 0) {
        setError(null);
      } else {
        setError(`${failedUploads.length}件の画像アップロードに失敗しました。再試行してください。`);
      }
    } finally {
      setRetryingFailedImages(false);
    }
  };

  return {
    ensureAuthorized,
    kinds,
    tags,
    kindId,
    name,
    description,
    latitude,
    longitude,
    isWishlist,
    selectedTagIds,
    relatedCandidates,
    selectedRelatedEntityIds,
    selectedImageFiles,
    failedImageFiles,
    tagDialogOpen,
    relatedDialogOpen,
    submitLoading,
    retryingFailedImages,
    imageOperationStatus,
    loading: kindsLoading || tagsLoading || entitiesLoading,
    error,
    setKindId,
    setName,
    setDescription,
    setLatitude,
    setLongitude,
    setIsWishlist,
    setTagDialogOpen,
    setRelatedDialogOpen,
    onToggleTag,
    onToggleRelatedEntity,
    onSelectImageFiles,
    onRemoveSelectedImage,
    retryFailedImageUploads,
    onTagCreated,
    onTagDeleted,
    submit
  };
}
