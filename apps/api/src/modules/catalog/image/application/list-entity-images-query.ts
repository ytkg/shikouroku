import { findEntityByIdFromD1 } from "../../entity/infra/entity-repository-d1";
import { listEntityImagesFromD1 } from "../infra/image-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import { toEntityImageResponse, type EntityImageResponseDto } from "./image-shared";

export async function listEntityImagesQuery(
  db: D1Database,
  entityId: string
): Promise<UseCaseResult<{ images: EntityImageResponseDto[] }>> {
  const entity = await findEntityByIdFromD1(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const images = await listEntityImagesFromD1(db, entityId);
  return success({
    images: images.map(toEntityImageResponse)
  });
}
