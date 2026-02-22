import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteEntityImage,
  fetchEntityImages,
  reorderEntityImages,
  uploadEntityImage
} from "@/entities/entity/api/images.client";
import { ApiError, INVALID_API_RESPONSE_CODE } from "@/shared/api/api-error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("images.client", () => {
  it("fetchEntityImagesは画像一覧レスポンスを正規化する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          images: [
            {
              id: "img-1",
              entity_id: "entity-1",
              file_name: "ramen.jpg",
              mime_type: "image/jpeg",
              file_size: 1024,
              sort_order: 1,
              url: "/api/entities/entity-1/images/img-1/file",
              created_at: "2026-02-22T00:00:00Z"
            }
          ]
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    await expect(fetchEntityImages("entity-1")).resolves.toEqual([
      {
        id: "img-1",
        entityId: "entity-1",
        fileName: "ramen.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024,
        sortOrder: 1,
        url: "/api/entities/entity-1/images/img-1/file",
        createdAt: "2026-02-22T00:00:00Z"
      }
    ]);
  });

  it("upload/delete/reorder は画像APIパスを使って更新する", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          image: {
            id: "img-1",
            entity_id: "entity-1",
            file_name: "ramen.jpg",
            mime_type: "image/jpeg",
            file_size: 1024,
            sort_order: 1,
            url: "/api/entities/entity-1/images/img-1/file",
            created_at: "2026-02-22T00:00:00Z"
          }
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const file = new File(["data"], "ramen.jpg", { type: "image/jpeg" });
    await uploadEntityImage("entity-1", file);

    fetchSpy.mockImplementation(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await deleteEntityImage("entity-1", "img-1");
    await reorderEntityImages("entity-1", { orderedImageIds: ["img-1"] });

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "/api/entities/entity-1/images",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData)
      })
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/entities/entity-1/images/img-1",
      expect.objectContaining({
        method: "DELETE"
      })
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      "/api/entities/entity-1/images/order",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ orderedImageIds: ["img-1"] })
      })
    );
  });

  it("uploadEntityImageは不正レスポンス形をApiError(INVALID_API_RESPONSE)として扱う", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: "yes" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await expect(
      uploadEntityImage("entity-1", new File(["data"], "ramen.jpg", { type: "image/jpeg" }))
    ).rejects.toMatchObject<ApiError>({
      status: 502,
      code: INVALID_API_RESPONSE_CODE
    });
  });
});
