import { type FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HelloResponse = {
  ok: boolean;
  message: string;
};

type Kind = {
  id: number;
  label: string;
};

type Entity = {
  id: string;
  kind_id: number;
  name: string;
  description: string | null;
  is_wishlist: number;
  created_at?: string;
  updated_at?: string;
};

function HomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [entities, setEntities] = useState<Entity[]>([]);

  const ensureAuthorized = (status: number) => {
    if (status === 401) {
      navigate("/login", { replace: true });
      return false;
    }
    return true;
  };

  const loadHello = async () => {
    setError(null);
    try {
      const res = await fetch("/api/hello");
      if (!ensureAuthorized(res.status)) {
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as HelloResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadEntities = async () => {
    try {
      const res = await fetch("/api/entities");
      if (!ensureAuthorized(res.status)) {
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as { ok: boolean; entities: Entity[] };
      setEntities(json.entities);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
    }
  };

  useEffect(() => {
    void loadHello();
    void loadEntities();
  }, []);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    navigate("/login", { replace: true });
  };

  if (checkingAuth) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>entities 一覧</CardTitle>
          <CardDescription>トップページは一覧表示です。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>hello API</Label>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-sm">
              {data ? JSON.stringify(data, null, 2) : "loading..."}
            </pre>
          </div>
          <div className="space-y-2">
            <Label>entities（最新50件）</Label>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-sm">
              {JSON.stringify(entities, null, 2)}
            </pre>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={loadEntities}>entities 再取得</Button>
          <Button variant="outline" onClick={() => navigate("/entities/new")}>
            新規登録ページへ
          </Button>
          <Button variant="secondary" onClick={logout}>
            ログアウト
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

function NewEntityPage() {
  const navigate = useNavigate();
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [kindId, setKindId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isWishlist, setIsWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<Entity | null>(null);

  const ensureAuthorized = (status: number) => {
    if (status === 401) {
      navigate("/login", { replace: true });
      return false;
    }
    return true;
  };

  const loadKinds = async () => {
    setError(null);
    try {
      const res = await fetch("/api/kinds");
      if (!ensureAuthorized(res.status)) {
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as { ok: boolean; kinds: Kind[] };
      setKinds(json.kinds);
      if (json.kinds.length > 0) {
        setKindId(String(json.kinds[0].id));
      }
    } catch (e) {
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
      const res = await fetch("/api/entities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kindId: Number(kindId),
          name,
          description,
          isWishlist
        })
      });
      if (!ensureAuthorized(res.status)) {
        return;
      }
      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        throw new Error(json.message ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { ok: boolean; entity: Entity };
      setSubmitResult(json.entity);
      setName("");
      setDescription("");
      setIsWishlist(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>entities 新規登録</CardTitle>
          <CardDescription>種別を選択して entity を登録します。</CardDescription>
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
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? "登録中..." : "登録する"}
            </Button>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>登録結果</Label>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-sm">
              {submitResult ? JSON.stringify(submitResult, null, 2) : "まだ登録していません"}
            </pre>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            一覧へ戻る
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        throw new Error("ログインに失敗しました");
      }
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>auth.takagi.dev の認証基盤を利用します。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/entities/new" element={<NewEntityPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
