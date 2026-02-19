import { useEffect, useState } from "react";
import { useEntityQuery } from "@/entities/entity";
import { useAuthGuard } from "@/features/auth";
import { KEEP_CURRENT_ERROR, resolveQueryError } from "@/shared/lib/query-error";

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

    const nextError = resolveQueryError({
      queryError,
      ensureAuthorized,
      notFoundMessage: "データが見つかりませんでした"
    });
    if (nextError !== KEEP_CURRENT_ERROR) {
      setError(nextError);
    }
  }, [entityId, queryError, ensureAuthorized]);

  return {
    entity,
    error,
    isLoading
  };
}
