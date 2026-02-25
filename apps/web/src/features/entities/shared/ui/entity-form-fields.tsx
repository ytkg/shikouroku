import type { ReactNode } from "react";
import type { Entity, Kind, Tag } from "@/entities/entity";
import { EntityBasicFields } from "./entity-basic-fields";
import { EntityLocationFields } from "./entity-location-fields";
import { EntityRelatedField } from "./entity-related-field";
import { EntityTagField } from "./entity-tag-field";
import { SelectablePillCheckbox } from "./selectable-pill-checkbox";

type RelatedCandidate = Pick<Entity, "id" | "name" | "kind" | "isWishlist" | "description" | "tags" | "firstImageUrl">;
const LOCATION_KIND_LABEL = "場所";

type EntityFormFieldsProps = {
  kinds: Kind[];
  tags: Tag[];
  kindId: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  isWishlist: boolean;
  selectedTagIds: number[];
  onKindIdChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
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
  latitude,
  longitude,
  isWishlist,
  selectedTagIds,
  onKindIdChange,
  onNameChange,
  onDescriptionChange,
  onLatitudeChange,
  onLongitudeChange,
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
  const selectedKind = kinds.find((kind) => String(kind.id) === kindId);
  const showLocationFields = selectedKind?.label === LOCATION_KIND_LABEL;

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
      {showLocationFields && (
        <EntityLocationFields
          latitude={latitude}
          longitude={longitude}
          onLatitudeChange={onLatitudeChange}
          onLongitudeChange={onLongitudeChange}
        />
      )}
      {hasRelatedEditor && (
        <EntityRelatedField
          relatedCandidates={relatedCandidates}
          selectedRelatedEntityIds={selectedRelatedEntityIds}
          onOpenRelatedDialog={onOpenRelatedDialog}
        />
      )}
      <SelectablePillCheckbox
        checked={isWishlist}
        onCheckedChange={onWishlistChange}
        className="w-fit"
      >
        気になる
      </SelectablePillCheckbox>
    </>
  );
}
