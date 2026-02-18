import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ApiError, createEntity, fetchKinds } from "@/features/entities/api/entities-api";
import type { Entity, Kind } from "@/features/entities/model/entity-types";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";

export default function NewEntityPage() {
  const navigate = useNavigate();
  const ensureAuthorized = useAuthGuard();
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [kindId, setKindId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isWishlist, setIsWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<Entity | null>(null);

  const loadKinds = async () => {
    setError(null);
    try {
      const kindsData = await fetchKinds();
      setKinds(kindsData);
      if (kindsData.length > 0) {
        setKindId(String(kindsData[0].id));
      }
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadKinds();
  }, []);

  const onCreateEntity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      const entity = await createEntity({
        kindId: Number(kindId),
        name,
        description,
        isWishlist
      });
      setSubmitResult(entity);
      setName("");
      setDescription("");
      setIsWishlist(false);
    } catch (e) {
      if (e instanceof ApiError && !ensureAuthorized(e.status)) {
        return;
      }
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <main className="w-full bg-background pt-20" />;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 pb-10 pt-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>嗜好 新規登録</CardTitle>
          <CardDescription>種別を選択して嗜好を登録します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onCreateEntity}>
            <div className="space-y-2">
              <Label htmlFor="kind">種別</Label>
              <select
                id="kind"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={kindId}
                onChange={(e) => setKindId(e.target.value)}
                required
              >
                {kinds.map((kind) => (
                  <option key={kind.id} value={kind.id}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">メモ</Label>
              <textarea
                id="description"
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isWishlist}
                onChange={(e) => setIsWishlist(e.target.checked)}
              />
              気になる
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? "登録中..." : "登録する"}
              </Button>
            </div>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>登録結果</Label>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-sm">
              {submitResult ? JSON.stringify(submitResult, null, 2) : "まだ登録していません"}
            </pre>
          </div>
        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => navigate("/")}>
        一覧へ戻る
      </Button>
    </main>
  );
}
