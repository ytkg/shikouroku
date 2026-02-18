import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { ApiError, fetchEntityById, fetchKinds, updateEntity } from "@/features/entities/api/entities-api";
import type { Entity, Kind } from "@/features/entities/model/entity-types";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";

export default function EntityEditPage() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const ensureAuthorized = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [kindId, setKindId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isWishlist, setIsWishlist] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!entityId) {
        setError("entity id が不正です");
        setLoading(false);
        return;
      }

      setError(null);
      try {
        const [entityData, kindsData] = await Promise.all([fetchEntityById(entityId), fetchKinds()]);
        setEntity(entityData);
        setKinds(kindsData);
        setKindId(String(entityData.kind_id));
        setName(entityData.name);
        setDescription(entityData.description ?? "");
        setIsWishlist(entityData.is_wishlist === 1);
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
    return <main className="min-h-screen bg-background pt-20" />;
  }

  const onSave = async () => {
    if (!entityId) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await updateEntity(entityId, {
        kindId: Number(kindId),
        name,
        description,
        isWishlist
      });
      setEntity(updated);
      setKindId(String(updated.kind_id));
      setName(updated.name);
      setDescription(updated.description ?? "");
      setIsWishlist(updated.is_wishlist === 1);
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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-4 pb-10 pt-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>entity 編集</CardTitle>
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
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
        <CardFooter className="flex justify-between gap-2">
          <Button variant="outline" onClick={() => navigate(`/entities/${entityId}`)}>
            詳細へ戻る
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
