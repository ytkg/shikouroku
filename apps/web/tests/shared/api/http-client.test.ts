import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { requestJson } from "@/shared/api/http.client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requestJson", () => {
  it("bodyをJSON化しcontent-typeを自動付与する", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const data = await requestJson<{ ok: boolean }>("/api/example", {
      method: "POST",
      body: { name: "alice" }
    });

    expect(data).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const requestInit = fetchSpy.mock.calls[0]?.[1];
    expect(requestInit?.body).toBe(JSON.stringify({ name: "alice" }));
    expect(new Headers(requestInit?.headers).get("content-type")).toBe("application/json");
  });

  it("content-typeが明示されている場合は上書きしない", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await requestJson<{ ok: boolean }>("/api/example", {
      method: "POST",
      headers: { "content-type": "application/vnd.api+json" },
      body: { name: "alice" }
    });

    const requestInit = fetchSpy.mock.calls[0]?.[1];
    expect(new Headers(requestInit?.headers).get("content-type")).toBe("application/vnd.api+json");
  });

  it("204レスポンスはundefinedを返す", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 204
      })
    );

    const data = await requestJson<undefined>("/api/no-content");

    expect(data).toBeUndefined();
  });

  it("非JSONの成功レスポンスはundefinedを返す", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", {
        status: 200,
        headers: { "content-type": "text/plain" }
      })
    );

    const data = await requestJson<undefined>("/api/plain");

    expect(data).toBeUndefined();
  });

  it("非2xxレスポンスはApiErrorをthrowする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: "unauthorized",
            code: "AUTH_401"
          }
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" }
        }
      )
    );

    await expect(requestJson("/api/protected")).rejects.toMatchObject<ApiError>({
      name: "ApiError",
      status: 401,
      message: "unauthorized",
      code: "AUTH_401"
    });
  });
});
