import { describe, expect, it } from "vitest";
import {
  entityKey,
  entityImagesKey,
  isEntityDetailKey,
  isEntityImagesListKey,
  isEntityRelatedListKey,
  relatedEntitiesKey
} from "@/entities/entity";
import {
  apiPaths,
  getEntityImageFilePath,
  getEntityImageOrderPath,
  getEntityImagePath,
  getEntityImagesPath,
  getEntityPath,
  getEntityRelatedPath,
  getEntityRelationPath,
  getMaintenanceImageCleanupTasksPath,
  getTagPath
} from "@/shared/config/api-paths";

describe("api-paths", () => {
  it("固定APIパス定数が期待値を持つ", () => {
    expect(apiPaths.authMe).toBe("/api/auth/me");
    expect(apiPaths.login).toBe("/api/login");
    expect(apiPaths.logout).toBe("/api/logout");
    expect(apiPaths.kinds).toBe("/api/kinds");
    expect(apiPaths.tags).toBe("/api/tags");
    expect(apiPaths.entities).toBe("/api/entities");
    expect(apiPaths.maintenanceImageCleanupTasks).toBe("/api/maintenance/image-cleanup/tasks");
  });

  it("動的APIパスを生成できる", () => {
    expect(getTagPath(10)).toBe("/api/tags/10");
    expect(getEntityPath("entity-1")).toBe("/api/entities/entity-1");
    expect(getEntityRelatedPath("entity-1")).toBe("/api/entities/entity-1/related");
    expect(getEntityRelationPath("entity-1", "entity-2")).toBe("/api/entities/entity-1/related/entity-2");
    expect(getEntityImagesPath("entity-1")).toBe("/api/entities/entity-1/images");
    expect(getEntityImagePath("entity-1", "img-1")).toBe("/api/entities/entity-1/images/img-1");
    expect(getEntityImageFilePath("entity-1", "img-1")).toBe("/api/entities/entity-1/images/img-1/file");
    expect(getEntityImageOrderPath("entity-1")).toBe("/api/entities/entity-1/images/order");
    expect(getMaintenanceImageCleanupTasksPath(20)).toBe("/api/maintenance/image-cleanup/tasks?limit=20");
  });

  it("entityIdの特殊文字をURLエンコードする", () => {
    expect(getEntityPath("id with/slash")).toBe("/api/entities/id%20with%2Fslash");
  });

  it("entityIdが既にエンコード済みでも二重エンコードしない", () => {
    expect(getEntityPath("id%20with%2Fslash")).toBe("/api/entities/id%20with%2Fslash");
    expect(getEntityRelatedPath("id%20with%2Fslash")).toBe("/api/entities/id%20with%2Fslash/related");
    expect(getEntityRelationPath("id%20with%2Fslash", "target%2Fid")).toBe(
      "/api/entities/id%20with%2Fslash/related/target%2Fid"
    );
    expect(getEntityImagePath("id%20with%2Fslash", "img%2F1")).toBe(
      "/api/entities/id%20with%2Fslash/images/img%2F1"
    );
  });

  it("entityKey は entity path と一致する", () => {
    expect(entityKey("id-1")).toBe("/api/entities/id-1");
    expect(relatedEntitiesKey("id-1")).toBe("/api/entities/id-1/related");
    expect(entityImagesKey("id-1")).toBe("/api/entities/id-1/images");
  });

  it("isEntityDetailKey は entity detail key だけを許可する", () => {
    expect(isEntityDetailKey("/api/entities/id-1")).toBe(true);
    expect(isEntityDetailKey("/api/entities/id%2F1")).toBe(true);
    expect(isEntityDetailKey("/api/entities")).toBe(false);
    expect(isEntityDetailKey("/api/entities/")).toBe(false);
    expect(isEntityDetailKey("/api/entities/id-1/sub")).toBe(false);
    expect(isEntityDetailKey("/api/tags/1")).toBe(false);
    expect(isEntityDetailKey(undefined)).toBe(false);
  });

  it("isEntityRelatedListKey は related list key だけを許可する", () => {
    expect(isEntityRelatedListKey("/api/entities/id-1/related")).toBe(true);
    expect(isEntityRelatedListKey("/api/entities/id-1")).toBe(false);
    expect(isEntityRelatedListKey("/api/entities/id-1/related/id-2")).toBe(false);
    expect(isEntityRelatedListKey("/api/tags/1")).toBe(false);
    expect(isEntityRelatedListKey(undefined)).toBe(false);
  });

  it("isEntityImagesListKey は images list key だけを許可する", () => {
    expect(isEntityImagesListKey("/api/entities/id-1/images")).toBe(true);
    expect(isEntityImagesListKey("/api/entities/id-1/images/img-1")).toBe(false);
    expect(isEntityImagesListKey("/api/entities/id-1/related")).toBe(false);
    expect(isEntityImagesListKey("/api/tags/1")).toBe(false);
    expect(isEntityImagesListKey(undefined)).toBe(false);
  });
});
