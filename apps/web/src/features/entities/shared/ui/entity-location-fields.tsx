import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type EntityLocationFieldsProps = {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

export function EntityLocationFields({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange
}: EntityLocationFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="latitude">緯度</Label>
        <Input
          id="latitude"
          type="text"
          inputMode="decimal"
          value={latitude}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text").trim();
            const values = text.split(",");
            if (values.length !== 2) {
              return;
            }

            const parsedLatitude = Number.parseFloat(values[0]?.trim() ?? "");
            const parsedLongitude = Number.parseFloat(values[1]?.trim() ?? "");
            if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
              return;
            }

            event.preventDefault();
            onLatitudeChange(String(parsedLatitude));
            onLongitudeChange(String(parsedLongitude));
          }}
          onChange={(event) => onLatitudeChange(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="longitude">経度</Label>
        <Input
          id="longitude"
          type="text"
          inputMode="decimal"
          value={longitude}
          onChange={(event) => onLongitudeChange(event.target.value)}
        />
      </div>
    </div>
  );
}
