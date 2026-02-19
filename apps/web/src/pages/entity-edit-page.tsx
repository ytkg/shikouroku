import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { ApiError, fetchEntityById, fetchKinds, fetchTags, updateEntity } from "@/features/entities/api/entities-api";
import type { Entity, Kind, Tag } from "@/features/entities/model/entity-types";
import { TagEditDialog } from "@/features/entities/ui/tag-edit-dialog";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";

export default function EntityEditPage() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const ensureAuthorized = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [kindId, setKindId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isWishlist, setIsWishlist] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!entityId) {
        setError("嗜好 ID が不正です");
        setLoading(false);
        return;
      }

      setError(null);
      try {
        const [entityData, kindsData, tagsData] = await Promise.all([
          fetchEntityById(entityId),
          fetchKinds(),
          fetchTags()
        ]);
        setEntity(entityData);
        setKinds(kindsData);
        setTags(tagsData);
        setKindId(String(entityData.kind.id));
        setName(entityData.name);
        setDescription(entityData.description ?? "");
        setIsWishlist(entityData.isWishlist);
        setSelectedTagIds(entityData.tags.map((tag) => tag.id));
      } catch (e) {
        if (e instanceof ApiError && !ensureAuthorized(e.status)) {
          return;
        }
        if (e instanceof ApiError && e.status === 404) {
          setError("データが見つかりませんでした");
        } else {
          setError(e instanceof Error ? e.message : "unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [entityId]);

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
    setTags((current) => {
      if (current.some((item) => item.id === tag.id)) {
        return current;
      }
      return [...current, tag].sort((a, b) => a.name.localeCompare(b.name, "ja"));
    });
    setSelectedTagIds((current) => {
      if (current.includes(tag.id)) {
        return current;
      }
      return [...current, tag.id];
    });
  };

  const onTagDeleted = (tagId: number) => {
    setTags((current) => current.filter((tag) => tag.id !== tagId));
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
