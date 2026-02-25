import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

type EntityDetailLocationMapProps = {
  latitude: number;
  longitude: number;
};

const DEFAULT_ZOOM = 17;
const PIN_ICON = L.icon({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function EntityDetailLocationMap({ latitude, longitude }: EntityDetailLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    markerRef.current = L.marker([latitude, longitude], { icon: PIN_ICON }).addTo(map);
    mapRef.current = map;

    return () => {
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.setView([latitude, longitude], map.getZoom());
    markerRef.current?.setLatLng([latitude, longitude]);
  }, [latitude, longitude]);

  return <div ref={mapContainerRef} className="isolate relative z-0 h-64 w-full overflow-hidden rounded-md border" />;
}
