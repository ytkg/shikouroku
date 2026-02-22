export type CreateRelationResult = "created" | "conflict" | "error";
export type DeleteRelationResult = "deleted" | "not_found" | "error";

export type RelationRepository = {
  listRelatedEntityIds: (entityId: string) => Promise<string[]>;
  createRelation: (entityIdA: string, entityIdB: string) => Promise<CreateRelationResult>;
  deleteRelation: (entityIdA: string, entityIdB: string) => Promise<DeleteRelationResult>;
};
