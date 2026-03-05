import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { DEFAULT_CENTER, DEFAULT_ZOOM, EMPTY_MAP_ZOOM, SINGLE_MARKER_ZOOM } from "../ui/entity-map-constants";
import type { MapLocationEntity } from "../ui/entity-map.types";

const PIN_ICON = L.icon({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type UseLeafletEntityMapInput = {
  filteredLocationEntities: MapLocationEntity[];
  onMarkerClick: (entityId: string) => void;
};

export function useLeafletEntityMap({ filteredLocationEntities, onMarkerClick }: UseLeafletEntityMapInput) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const focusEntityOnMap = useCallback(
    (entityId: string) => {
      const map = mapRef.current;
      const target = filteredLocationEntities.find((entity) => entity.id === entityId);
      if (!map || !target) {
        return;
      }
      map.setView([target.latitude, target.longitude], SINGLE_MARKER_ZOOM, {
        animate: true
      });
    },
    [filteredLocationEntities]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      markerLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) {
      return;
    }

    markerLayer.clearLayers();

    if (filteredLocationEntities.length === 0) {
      map.setView(DEFAULT_CENTER, EMPTY_MAP_ZOOM);
      return;
    }

    const points = filteredLocationEntities.map((entity) => [entity.latitude, entity.longitude] as [number, number]);
    for (const entity of filteredLocationEntities) {
      const marker = L.marker([entity.latitude, entity.longitude], { icon: PIN_ICON }).addTo(markerLayer);
      marker.on("click", () => {
        onMarkerClick(entity.id);
      });
    }

    if (filteredLocationEntities.length === 1) {
      const point = points[0];
      if (point) {
        map.setView(point, SINGLE_MARKER_ZOOM);
      }
      return;
    }

    map.fitBounds(points, {
      padding: [32, 32]
    });
  }, [filteredLocationEntities, onMarkerClick]);

  return {
    focusEntityOnMap,
    mapContainerRef
  };
}
