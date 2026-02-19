import { useEffect, useState } from "react";
import { useAuthGuard } from "@/features/auth";
import { useEntityQuery } from "@/features/entities/model/entity.query";
import { ApiError } from "@/shared/api/api-error";

type EntityDetailPageResult = {
  entity: ReturnType<typeof useEntityQuery>["data"];
  error: string | null;
  isLoading: boolean;
};

export function useEntityDetailPage(entityId: string | undefined): EntityDetailPageResult {
  const ensureAuthorized = useAuthGuard();
  const { data: entity, error: queryError, isLoading } = useEntityQuery(entityId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId) {
      setError("嗜好 ID が不正です");
      return;
    }

    if (!queryError) {
      setError(null);
      return;
    }

    if (queryError instanceof ApiError && !ensureAuthorized(queryError.status)) {
      return;
    }

    if (queryError instanceof ApiError && queryError.status === 404) {
      setError("データが見つかりませんでした");
      return;
    }

    setError(queryError instanceof Error ? queryError.message : "unknown error");
  }, [entityId, queryError, ensureAuthorized]);

  return {
    entity,
    error,
    isLoading
  };
}
