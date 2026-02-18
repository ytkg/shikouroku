import { useEffect, useState } from "react";

type HelloResponse = {
  ok: boolean;
  message: string;
};

export default function App() {
  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/hello");
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
    </main>
  );
}
