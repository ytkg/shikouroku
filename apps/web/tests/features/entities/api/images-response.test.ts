import { describe, expect, it } from "vitest";
import { ApiError, INVALID_API_RESPONSE_CODE } from "@/shared/api/api-error";
import {
  parseEntityImageMutationResponse,
  parseEntityImageResponse,
  parseEntityImagesResponse
} from "@/entities/entity/api/images.response";

describe("images.response", () => {
  it("画像一覧レスポンスを正規化して返す", () => {
    const images = parseEntityImagesResponse({
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
    });

    expect(images).toEqual([
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

  it("画像単体レスポンスと mutation レスポンスを検証できる", () => {
    expect(
      parseEntityImageResponse({
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
      })
    ).toEqual({
      id: "img-1",
      entityId: "entity-1",
      fileName: "ramen.jpg",
      mimeType: "image/jpeg",
      fileSize: 1024,
      sortOrder: 1,
      url: "/api/entities/entity-1/images/img-1/file",
      createdAt: "2026-02-22T00:00:00Z"
    });

    expect(() =>
      parseEntityImageMutationResponse({
        ok: true
      })
    ).not.toThrow();
  });

  it("不正レスポンスはApiError(INVALID_API_RESPONSE)をthrowする", () => {
    let thrown: unknown;

    try {
      parseEntityImageResponse({
        ok: true,
        image: {
          id: "img-1",
          entity_id: "entity-1",
          file_name: "ramen.jpg",
          mime_type: "image/jpeg",
          file_size: "1024",
          sort_order: 1,
          url: "/api/entities/entity-1/images/img-1/file",
          created_at: "2026-02-22T00:00:00Z"
        }
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({
      status: 502,
      code: INVALID_API_RESPONSE_CODE
    });
  });
});
