import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "@/shared/api/api-error";

describe("toApiError", () => {
  it("JSONのmessageフィールドを優先して利用する", async () => {
    const response = new Response(JSON.stringify({ message: "invalid request" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });

    const error = await toApiError(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("invalid request");
    expect(error.code).toBeUndefined();
  });

  it("ネストされたerrorオブジェクトからmessage/codeを抽出する", async () => {
    const response = new Response(
      JSON.stringify({ error: { message: "unauthorized", code: "AUTH_401" } }),
      {
        status: 401,
        headers: { "content-type": "application/json" }
      }
    );

    const error = await toApiError(response);

    expect(error.status).toBe(401);
    expect(error.message).toBe("unauthorized");
    expect(error.code).toBe("AUTH_401");
  });

  it("JSON以外のレスポンスではHTTPステータスをフォールバックする", async () => {
    const response = new Response("not found", {
      status: 404,
      headers: { "content-type": "text/plain" }
    });

    const error = await toApiError(response);

    expect(error.status).toBe(404);
    expect(error.message).toBe("HTTP 404");
    expect(error.code).toBeUndefined();
  });

  it("content-typeがJSONでもパース失敗時はHTTPステータスへフォールバックする", async () => {
    const response = new Response("{{invalid json}}", {
      status: 500,
      headers: { "content-type": "application/json" }
    });

    const error = await toApiError(response);

    expect(error.status).toBe(500);
    expect(error.message).toBe("HTTP 500");
    expect(error.code).toBeUndefined();
  });
});
