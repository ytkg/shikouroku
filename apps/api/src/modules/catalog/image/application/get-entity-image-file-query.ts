import type { EntityImageRecord } from "../../../../shared/db/records";
import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import { findEntityImageByIdFromD1 } from "../infra/image-repository-d1";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";

export async function getEntityImageFileQuery(
  db: D1Database,
  imageBucket: R2Bucket,
  entityReadRepository: Pick<EntityReadRepository, "findEntityById">,
  entityId: string,
  imageId: string
): Promise<
  UseCaseResult<{
    image: EntityImageRecord;
    file: R2ObjectBody;
  }>
> {
  const entity = await entityReadRepository.findEntityById(entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const image = await findEntityImageByIdFromD1(db, entityId, imageId);
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
