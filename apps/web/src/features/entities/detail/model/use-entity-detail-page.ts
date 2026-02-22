import { useEffect, useState } from "react";
import {
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
  error: string | null;
  relatedError: string | null;
  isLoading: boolean;
  relatedLoading: boolean;
  removingRelatedEntityId: string | null;
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
  const { deleteEntityRelation } = useEntityMutations();
  const [error, setError] = useState<string | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [removingRelatedEntityId, setRemovingRelatedEntityId] = useState<string | null>(null);

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
    error,
    relatedError,
    isLoading,
    relatedLoading,
    removingRelatedEntityId,
    removeRelated
  };
}
