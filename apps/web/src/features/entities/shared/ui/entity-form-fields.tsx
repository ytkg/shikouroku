import type { ReactNode } from "react";
import type { Entity, Kind, Tag } from "@/entities/entity";
import { Checkbox } from "@/shared/ui/form-controls";
import { EntityBasicFields } from "./entity-basic-fields";
import { EntityRelatedField } from "./entity-related-field";
import { EntityTagField } from "./entity-tag-field";

type RelatedCandidate = Pick<Entity, "id" | "name" | "kind">;

type EntityFormFieldsProps = {
  kinds: Kind[];
  tags: Tag[];
  kindId: string;
  name: string;
  description: string;
  isWishlist: boolean;
  selectedTagIds: number[];
  onKindIdChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onWishlistChange: (checked: boolean) => void;
  onToggleTag: (tagId: number, checked: boolean) => void;
  onOpenTagDialog: () => void;
  imageFieldContent?: ReactNode;
  relatedCandidates?: RelatedCandidate[];
  selectedRelatedEntityIds?: string[];
  onOpenRelatedDialog?: () => void;
  kindRequired?: boolean;
};

export function EntityFormFields({
  kinds,
  tags,
  kindId,
  name,
  description,
  isWishlist,
  selectedTagIds,
  onKindIdChange,
  onNameChange,
  onDescriptionChange,
  onWishlistChange,
  onToggleTag,
  onOpenTagDialog,
  imageFieldContent,
  relatedCandidates,
  selectedRelatedEntityIds,
  onOpenRelatedDialog,
  kindRequired = true
}: EntityFormFieldsProps) {
  const hasRelatedEditor =
    relatedCandidates !== undefined &&
    selectedRelatedEntityIds !== undefined &&
    onOpenRelatedDialog !== undefined;

  return (
    <>
      <EntityBasicFields
        kinds={kinds}
        kindId={kindId}
        name={name}
        description={description}
        onKindIdChange={onKindIdChange}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        kindRequired={kindRequired}
      />
      <EntityTagField
        tags={tags}
        selectedTagIds={selectedTagIds}
        onToggleTag={onToggleTag}
        onOpenTagDialog={onOpenTagDialog}
      />
      {imageFieldContent}
      {hasRelatedEditor && (
        <EntityRelatedField
          relatedCandidates={relatedCandidates}
          selectedRelatedEntityIds={selectedRelatedEntityIds}
          onOpenRelatedDialog={onOpenRelatedDialog}
        />
      )}
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={isWishlist}
          onChange={(event) => onWishlistChange(event.target.checked)}
        />
        気になる
      </label>
    </>
  );
}
