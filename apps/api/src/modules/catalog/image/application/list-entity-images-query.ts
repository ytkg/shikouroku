import type { EntityReadRepository } from "../../entity/ports/entity-read-repository";
import type { EntityImageRepository } from "../ports/entity-image-repository";
import { fail, success, type UseCaseResult } from "../../../../shared/application/result";
import { toEntityImageResponse, type EntityImageResponseDto } from "./image-shared";

export async function listEntityImagesQuery(
  entityReadRepository: Pick<EntityReadRepository, "findEntityById">,
  entityImageRepository: Pick<EntityImageRepository, "listEntityImages">,
  entityId: string
): Promise<UseCaseResult<{ images: EntityImageResponseDto[] }>> {
  const entity = await entityReadRepository.findEntityById(entityId);
  if (!entity) {
    return fail(404, "entity not found");
  }

  const images = await entityImageRepository.listEntityImages(entityId);
  return success({
    images: images.map(toEntityImageResponse)
  });
}
