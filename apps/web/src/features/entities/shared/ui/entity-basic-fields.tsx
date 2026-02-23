import type { Kind } from "@/entities/entity";
import { Select, Textarea } from "@/shared/ui/form-controls";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type EntityBasicFieldsProps = {
  kinds: Kind[];
  kindId: string;
  name: string;
  description: string;
  onKindIdChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  kindRequired?: boolean;
};

export function EntityBasicFields({
  kinds,
  kindId,
  name,
  description,
  onKindIdChange,
  onNameChange,
  onDescriptionChange,
  kindRequired = true
}: EntityBasicFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="kind">種別</Label>
        <Select
          id="kind"
          value={kindId}
          onChange={(event) => onKindIdChange(event.target.value)}
          required={kindRequired}
        >
          {kinds.map((kind) => (
            <option key={kind.id} value={kind.id}>
              {kind.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">名前</Label>
        <Input id="name" value={name} onChange={(event) => onNameChange(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">メモ</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </div>
    </>
  );
}
