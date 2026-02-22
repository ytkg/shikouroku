import { findEntityById } from "../../../../repositories/entity-repository";
import { listEntityImages } from "../../../../repositories/entity-image-repository";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";
import { toEntityImageResponse, type EntityImageResponseDto } from "./image-shared";

export async function listEntityImagesQuery(
  db: D1Database,
  entityId: string
): Promise<UseCaseResult<{ images: EntityImageResponseDto[] }>> {
  const entity = await findEntityById(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const images = await listEntityImages(db, entityId);
  return success({
    images: images.map(toEntityImageResponse)
  });
}
