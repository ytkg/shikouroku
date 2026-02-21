import { useEffect, useMemo, useState } from "react";
import {
  useEntitiesQuery,
  useEntityMutations,
  useEntityQuery,
  useRelatedEntitiesQuery
} from "@/entities/entity";
import type { Entity } from "@/entities/entity";
import { ApiError } from "@/shared/api/api-error";
import { useAuthGuard } from "@/features/auth";
import { errorMessages } from "@/shared/config/error-messages";
import { toErrorMessage } from "@/shared/lib/error-message";
import { KEEP_CURRENT_ERROR, resolveQueryError } from "@/shared/lib/query-error";

type EntityDetailPageResult = {
  entity: ReturnType<typeof useEntityQuery>["data"];
  relatedEntities: Entity[];
  relatedCandidates: Entity[];
  error: string | null;
  relatedError: string | null;
  isLoading: boolean;
  relatedLoading: boolean;
  relatedDialogOpen: boolean;
  relatedCandidateId: string;
  relatedSaving: boolean;
  removingRelatedEntityId: string | null;
  setRelatedDialogOpen: (open: boolean) => void;
  setRelatedCandidateId: (value: string) => void;
  addRelated: () => Promise<void>;
  removeRelated: (relatedEntityId: string) => Promise<void>;
};

export function useEntityDetailPage(entityId: string | undefined): EntityDetailPageResult {
  const ensureAuthorized = useAuthGuard();
  const { data: entity, error: entityQueryError, isLoading } = useEntityQuery(entityId);
  const {
    data: relatedEntities = [],
    error: relatedQueryError,
    isLoading: relatedLoading
  } = useRelatedEntitiesQuery(entityId);
  const { data: entities = [], error: entitiesQueryError } = useEntitiesQuery();
  const { createEntityRelation, deleteEntityRelation } = useEntityMutations();
  const [error, setError] = useState<string | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [relatedDialogOpen, setRelatedDialogOpen] = useState(false);
  const [relatedCandidateId, setRelatedCandidateId] = useState("");
  const [relatedSaving, setRelatedSaving] = useState(false);
  const [removingRelatedEntityId, setRemovingRelatedEntityId] = useState<string | null>(null);

  const relatedEntityIds = useMemo(
    () => new Set(relatedEntities.map((relatedEntity) => relatedEntity.id)),
    [relatedEntities]
  );
  const relatedCandidates = useMemo(
    () =>
      entities.filter(
        (candidate) => candidate.id !== entityId && !relatedEntityIds.has(candidate.id)
      ),
    [entities, entityId, relatedEntityIds]
  );

  useEffect(() => {
    if (!entityId) {
      setError(errorMessages.invalidEntityId);
      return;
    }

    const nextError = resolveQueryError({
      queryError: entityQueryError ?? relatedQueryError,
      ensureAuthorized,
      notFoundMessage: errorMessages.entityNotFound
    });
    if (nextError !== KEEP_CURRENT_ERROR) {
      setError(nextError);
    }
  }, [entityId, entityQueryError, relatedQueryError, ensureAuthorized]);

  useEffect(() => {
    if (!entitiesQueryError) {
      return;
    }

    const nextError = resolveQueryError({
      queryError: entitiesQueryError,
      ensureAuthorized
    });
    if (nextError !== KEEP_CURRENT_ERROR) {
      setRelatedError(nextError);
    }
  }, [entitiesQueryError, ensureAuthorized]);

  useEffect(() => {
    if (!relatedDialogOpen) {
      return;
    }

    if (relatedCandidates.length === 0) {
      setRelatedCandidateId("");
      return;
    }

    if (relatedCandidates.some((candidate) => candidate.id === relatedCandidateId)) {
      return;
    }

    setRelatedCandidateId(relatedCandidates[0]?.id ?? "");
  }, [relatedDialogOpen, relatedCandidates, relatedCandidateId]);

  const addRelated = async () => {
    if (!entityId) {
      return;
    }

    if (relatedCandidateId.length === 0) {
      setRelatedError(errorMessages.relatedEntityRequired);
      return;
    }

    setRelatedSaving(true);
    setRelatedError(null);
    try {
      await createEntityRelation(entityId, {
        relatedEntityId: relatedCandidateId
      });
      setRelatedDialogOpen(false);
      setRelatedCandidateId("");
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setRelatedError(toErrorMessage(e));
    } finally {
      setRelatedSaving(false);
    }
  };

  const removeRelated = async (relatedEntityId: string) => {
    if (!entityId) {
      return;
    }

    setRemovingRelatedEntityId(relatedEntityId);
    setRelatedError(null);
    try {
      await deleteEntityRelation(entityId, relatedEntityId);
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setRelatedError(toErrorMessage(e));
    } finally {
      setRemovingRelatedEntityId(null);
    }
  };

  return {
    entity,
    relatedEntities,
    relatedCandidates,
    error,
    relatedError,
    isLoading,
    relatedLoading,
    relatedDialogOpen,
    relatedCandidateId,
    relatedSaving,
    removingRelatedEntityId,
    setRelatedDialogOpen,
    setRelatedCandidateId,
    addRelated,
    removeRelated
  };
}
