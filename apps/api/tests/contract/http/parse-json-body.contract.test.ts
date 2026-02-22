import { Hono } from "hono";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import type { AppEnv } from "../../../src/app-env";
import { parseJsonBody } from "../../../src/shared/http/parse-json-body";
import { jsonOk } from "../../../src/shared/http/api-response";
import { REQUEST_ID_HEADER, requestIdMiddleware } from "../../../src/shared/http/request-id";

const bodySchema = z.object({
  name: z.string().trim().min(1)
});

function createContractApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use("*", requestIdMiddleware);
  app.post("/echo", async (c) => {
    const parsed = await parseJsonBody(c, bodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    return jsonOk(c, { name: parsed.data.name });
  });
  return app;
}

describe("parseJsonBody contract", () => {
  it("returns INVALID_JSON_BODY for malformed json", async () => {
    const app = createContractApp();
    const response = await app.request("http://localhost/echo", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [REQUEST_ID_HEADER]: "req-malformed"
      },
      body: "{"
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "INVALID_JSON_BODY",
        message: "invalid json body"
      },
      requestId: "req-malformed"
    });
  });

  it("returns INVALID_REQUEST_BODY for schema validation errors", async () => {
    const app = createContractApp();
    const response = await app.request("http://localhost/echo", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [REQUEST_ID_HEADER]: "req-schema"
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "INVALID_REQUEST_BODY",
        message: "name is required"
      },
      requestId: "req-schema"
    });
  });
});
