import { type FormEvent, useEffect, useState } from "react";

type HelloResponse = {
  ok: boolean;
  message: string;
};

function HomePage() {
  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
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
      }
    };

    load();
  }, []);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <main className="container">
      <h1>shikouroku</h1>
      <p>Cloudflare Workers + React SPA</p>

      <section>
        <h2>APIの応答</h2>
        {error ? (
          <pre>{error}</pre>
        ) : (
          <pre>{data ? JSON.stringify(data, null, 2) : "loading..."}</pre>
        )}
      </section>
      <button onClick={logout}>ログアウト</button>
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
    <main className="container">
      <h1>ログイン</h1>
      <form className="login-form" onSubmit={onSubmit}>
        <label>
          ユーザー名
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          パスワード
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </main>
  );
}

export default function App() {
  if (window.location.pathname === "/login") {
    return <LoginPage />;
  }
  return <HomePage />;
}
