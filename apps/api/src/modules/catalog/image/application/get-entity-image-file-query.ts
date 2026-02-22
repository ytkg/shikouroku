import type { EntityImageRecord } from "../../../../domain/models";
import { findEntityById } from "../../../../repositories/entity-repository";
import { findEntityImageById } from "../../../../repositories/entity-image-repository";
import { fail, success, type UseCaseResult } from "../../../../usecases/result";

export async function getEntityImageFileQuery(
  db: D1Database,
  imageBucket: R2Bucket,
  entityId: string,
  imageId: string
): Promise<
  UseCaseResult<{
    image: EntityImageRecord;
    file: R2ObjectBody;
  }>
> {
  const entity = await findEntityById(db, entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const image = await findEntityImageById(db, entityId, imageId);
  if (!image) {
    return fail(404, "image not found");
  }

  const file = await imageBucket.get(image.object_key);
  if (!file || !file.body) {
    return fail(404, "image file not found");
  }

  return success({
    image,
    file
  });
}
