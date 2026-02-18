import { type FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

function HomePage() {
  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [note, setNote] = useState("hello from shadcn/ui");

  const loadHello = async () => {
    setError(null);
    try {
      const res = await fetch("/api/hello");
      if (res.status === 401) {
        window.location.href = "/login";
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

  useEffect(() => {
    void loadHello();
  }, []);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (checkingAuth) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>shikouroku</CardTitle>
          <CardDescription>
            Tailwind CSS + shadcn/ui 導入済み。Workers API と同一オリジンで連携しています。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">メモ入力（Input確認）</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>APIの応答</Label>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-sm">
              {error ? error : data ? JSON.stringify(data, null, 2) : "loading..."}
            </pre>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={loadHello}>/api/hello を再取得</Button>
          <Button variant="secondary" onClick={logout}>
            ログアウト
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

function LoginPage() {
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
      window.location.href = "/";
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
  if (window.location.pathname === "/login") {
    return <LoginPage />;
  }
  return <HomePage />;
}
