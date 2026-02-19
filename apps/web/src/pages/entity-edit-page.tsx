import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { ApiError } from "@/features/entities/api/entities-api";
import type { Tag } from "@/features/entities/model/entity-types";
import {
  useEntityMutations,
  useEntityQuery,
  useKindsQuery,
  useTagsQuery
} from "@/features/entities/model/use-entities-api";
import { TagEditDialog } from "@/features/entities/ui/tag-edit-dialog";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";

export default function EntityEditPage() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
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

    const queryError = entityError ?? kindsError ?? tagsError;
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
  }, [entityId, entityError, kindsError, tagsError, ensureAuthorized]);

  const loading = Boolean(entityId) && (entityLoading || kindsLoading || tagsLoading);
  if (loading) {
    return <main className="w-full bg-background pt-20" />;
  }

  const onToggleTag = (tagId: number, checked: boolean) => {
    setSelectedTagIds((current) => {
      if (checked) {
        if (current.includes(tagId)) {
          return current;
        }
        return [...current, tagId];
      }
      return current.filter((id) => id !== tagId);
    });
  };

  const onTagCreated = (tag: Tag) => {
    setSelectedTagIds((current) => {
      if (current.includes(tag.id)) {
        return current;
      }
      return [...current, tag.id];
    });
  };

  const onTagDeleted = (tagId: number) => {
    setSelectedTagIds((current) => current.filter((id) => id !== tagId));
  };

  const onSave = async () => {
    if (!entityId) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await updateEntity(entityId, {
        kindId: Number(kindId),
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
      navigate(`/entities/${entityId}`);
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-10 pt-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>嗜好 編集</CardTitle>
          <CardDescription>内容を編集して保存します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            entity && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="kind">種別</Label>
                  <select
                    id="kind"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                    value={kindId}
                    onChange={(e) => setKindId(e.target.value)}
                  >
                    {kinds.map((kind) => (
                      <option key={kind.id} value={kind.id}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name">名前</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">メモ</Label>
                  <textarea
                    id="description"
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label>タグ</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTagDialogOpen(true)}
                    >
                      タグを編集
                    </Button>
                  </div>
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">タグが登録されていません。</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <label
                          key={tag.id}
                          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTagIds.includes(tag.id)}
                            onChange={(e) => onToggleTag(tag.id, e.target.checked)}
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isWishlist}
                      onChange={(e) => setIsWishlist(e.target.checked)}
                    />
                    気になる
                  </label>
                </div>
              </>
            )
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </CardFooter>
      </Card>
      <Button variant="outline" onClick={() => navigate(`/entities/${entityId}`)}>
        詳細へ戻る
      </Button>
      <TagEditDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        tags={tags}
        onCreated={onTagCreated}
        onDeleted={onTagDeleted}
        ensureAuthorized={ensureAuthorized}
      />
    </main>
  );
}
