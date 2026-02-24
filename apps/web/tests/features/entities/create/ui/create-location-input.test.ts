import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const locationFieldsPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-location-fields.tsx"
);
const formFieldsPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/shared/ui/entity-form-fields.tsx"
);
const createFormPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/create/model/use-create-entity-form.ts"
);
const editFormPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/edit/model/use-edit-entity-form.ts"
);

describe("create/edit location fields", () => {
  it("EntityLocationFields に緯度経度入力と貼り付け分割ロジックがある", () => {
    const source = fs.readFileSync(locationFieldsPath, "utf-8");

    expect(source).toContain('Label htmlFor="latitude"');
    expect(source).toContain('Label htmlFor="longitude"');
    expect(source).toContain('inputMode="decimal"');
    expect(source).toContain('const values = text.split(",");');
    expect(source).toContain("Number.parseFloat(values[0]?.trim() ?? \"\")");
    expect(source).toContain("Number.parseFloat(values[1]?.trim() ?? \"\")");
    expect(source).toContain("event.preventDefault();");
    expect(source).toContain("onLatitudeChange(String(parsedLatitude));");
    expect(source).toContain("onLongitudeChange(String(parsedLongitude));");
  });

  it("位置情報入力はフォームで画像入力の後に配置される", () => {
    const source = fs.readFileSync(formFieldsPath, "utf-8");

    const imageIndex = source.indexOf("{imageFieldContent}");
    const locationIndex = source.indexOf("<EntityLocationFields");
    expect(imageIndex).toBeGreaterThan(-1);
    expect(locationIndex).toBeGreaterThan(-1);
    expect(locationIndex).toBeGreaterThan(imageIndex);
  });

  it("新規フォームは緯度経度を保持し、payload に含める", () => {
    const source = fs.readFileSync(createFormPath, "utf-8");

    expect(source).toContain('const [latitude, setLatitude] = useState("");');
    expect(source).toContain('const [longitude, setLongitude] = useState("");');
    expect(source).toContain("...(isLocationKind && parsedLocation.location ? parsedLocation.location : {})");
  });

  it("編集フォームは緯度経度を保持し、payload に含める", () => {
    const source = fs.readFileSync(editFormPath, "utf-8");

    expect(source).toContain('const [latitude, setLatitude] = useState("");');
    expect(source).toContain('const [longitude, setLongitude] = useState("");');
    expect(source).toContain("setLatitude(entity.location ? String(entity.location.latitude) : \"\");");
    expect(source).toContain("setLongitude(entity.location ? String(entity.location.longitude) : \"\");");
    expect(source).toContain("...(isLocationKind && parsedLocation.location ? parsedLocation.location : {})");
  });
});
