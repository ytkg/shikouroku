import type { EntityImageRecord } from "../../../../shared/db/records";
import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import type { EntityImageRepository } from "../ports/entity-image-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";

export async function getEntityImageFileQuery(
  entityImageRepository: Pick<EntityImageRepository, "findEntityImageById">,
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

  const image = await entityImageRepository.findEntityImageById(entityId, imageId);
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
