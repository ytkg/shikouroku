import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useEntityLocationsQuery, useEntitiesQuery } from "@/entities/entity";
import { useAuthStatus } from "@/features/auth";
import {
  getEntityEditPath,
  getLoginPath,
  routePaths
} from "@/shared/config/route-paths";
import { toErrorMessage } from "@/shared/lib/error-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { buildRegistrationCheckResult } from "../model/registration-check";

function EntityListSection({
  title,
  description,
  entities
}: {
  title: string;
  description: string;
  entities: { id: string; kind: { label: string }; name: string }[];
}) {
  if (entities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">不足はありません。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {entities.map((entity) => (
            <li key={entity.id} className="rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{entity.name}</p>
                  <p className="text-xs text-muted-foreground">{entity.kind.label}</p>
                </div>
                <Link className="text-xs font-medium underline" to={getEntityEditPath(entity.id)}>
                  編集へ
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function RegistrationCheckPageContent() {
  const { data: isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const {
    data: entities = [],
    isLoading: entitiesLoading,
    error: entitiesError
  } = useEntitiesQuery();
  const {
    data: locations = [],
    isLoading: locationsLoading,
    error: locationsError
  } = useEntityLocationsQuery();

  const result = useMemo(() => buildRegistrationCheckResult(entities, locations), [entities, locations]);
  const loading = authLoading || entitiesLoading || locationsLoading;
  const error = entitiesError ?? locationsError;

  if (!loading && isAuthenticated === false) {
    return <Navigate to={getLoginPath(routePaths.registrationCheck)} replace />;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-4 pt-16">
      <Card>
        <CardHeader>
          <CardTitle>登録漏れチェック</CardTitle>
          <CardDescription>場所の緯度経度漏れ、画像未登録、タグ未設定を確認できます。</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <div className="rounded-md border px-2 py-3">
            <p className="text-xs text-muted-foreground">対象件数（気になる除外）</p>
            <p className="text-xl font-semibold">{result.checkedEntities.length}</p>
          </div>
          <div className="rounded-md border px-2 py-3">
            <p className="text-xs text-muted-foreground">タグ未設定</p>
            <p className="text-xl font-semibold text-destructive">{result.missingTagEntities.length}</p>
          </div>
          <div className="rounded-md border px-2 py-3">
            <p className="text-xs text-muted-foreground">画像未登録</p>
            <p className="text-xl font-semibold text-destructive">{result.missingImageEntities.length}</p>
          </div>
          <div className="rounded-md border px-2 py-3">
            <p className="text-xs text-muted-foreground">緯度経度漏れ</p>
            <p className="text-xl font-semibold text-destructive">{result.missingLocationEntities.length}</p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">読み込み中です...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">{toErrorMessage(error)}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <EntityListSection
            title="タグが未設定"
            description="タグが1件も付与されていない嗜好です。"
            entities={result.missingTagEntities}
          />
          <EntityListSection
            title="画像が未登録"
            description="嗜好画像が1件も登録されていない嗜好です。"
            entities={result.missingImageEntities}
          />
          <EntityListSection
            title="場所の緯度経度が未登録"
            description="種別が「場所」なのに緯度経度が未登録の嗜好です。"
            entities={result.missingLocationEntities}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">登録漏れなし</CardTitle>
              <CardDescription>緯度経度・画像・タグの条件を満たしている嗜好数です。</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{result.completeEntities.length}件</p>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
