import { EntityDetailLocationMap } from "./entity-detail-location-map";

type EntityDetailLocationSectionProps = {
  latitude: number;
  longitude: number;
};

export function EntityDetailLocationSection({
  latitude,
  longitude
}: EntityDetailLocationSectionProps) {
  return (
    <div className="space-y-1">
      <p className="ui-meta-text">位置情報</p>
      <p className="ui-body-text">
        緯度: {latitude} / 経度: {longitude}
      </p>
      <EntityDetailLocationMap latitude={latitude} longitude={longitude} />
    </div>
  );
}
