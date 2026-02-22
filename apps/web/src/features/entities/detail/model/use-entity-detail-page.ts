import { useEffect, useState } from "react";
import { useEntityQuery, useRelatedEntitiesQuery } from "@/entities/entity";
import type { Entity } from "@/entities/entity";
import { useAuthGuard } from "@/features/auth";
import { errorMessages } from "@/shared/config/error-messages";
import { KEEP_CURRENT_ERROR, resolveQueryError } from "@/shared/lib/query-error";

type EntityDetailPageResult = {
  entity: ReturnType<typeof useEntityQuery>["data"];
  relatedEntities: Entity[];
  error: string | null;
  isLoading: boolean;
  relatedLoading: boolean;
};

export function useEntityDetailPage(entityId: string | undefined): EntityDetailPageResult {
  const ensureAuthorized = useAuthGuard();
  const { data: entity, error: entityQueryError, isLoading } = useEntityQuery(entityId);
  const {
    data: relatedEntities = [],
    error: relatedQueryError,
    isLoading: relatedLoading
  } = useRelatedEntitiesQuery(entityId);
  const [error, setError] = useState<string | null>(null);

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

  return {
    entity,
    relatedEntities,
    error,
    isLoading,
    relatedLoading
  };
}
