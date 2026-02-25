import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import {
  useEntityImagesQuery,
  useEntityLocationsQuery,
  useEntityQuery
} from "@/entities/entity";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/form-controls";
import { Button } from "@/shared/ui/button";
import { ModalShell } from "@/shared/ui/modal-shell";
import { Skeleton } from "@/shared/ui/skeleton";

const DEFAULT_CENTER: [number, number] = [35.681236, 139.767125];
const DEFAULT_ZOOM = 12;
const EMPTY_MAP_ZOOM = 6;
const SINGLE_MARKER_ZOOM = 15;

const PIN_ICON = L.icon({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type LocationEntity = { id: string; name: string; latitude: number; longitude: number };

export function EntityMapPageContent() {
  const { data: locations = [], error, isLoading } = useEntityLocationsQuery();
  const [selectedTagId, setSelectedTagId] = useState<string>("all");
  const [nameQuery, setNameQuery] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const { data: selectedEntity, isLoading: isSelectedEntityLoading } = useEntityQuery(
    selectedEntityId ?? undefined
  );
  const { data: selectedEntityImages = [], isLoading: isSelectedEntityImagesLoading } = useEntityImagesQuery(
    selectedEntityId ?? undefined
  );
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const tagOptions = useMemo(
    () =>
      Array.from(
        new Map(
          locations
            .flatMap((entity) => entity.tags)
            .map((tag) => [tag.id, tag.name])
        ).entries()
      )
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [locations]
  );
  const filteredLocations = useMemo(() => {
    const normalizedQuery = nameQuery.trim().toLocaleLowerCase();
    return locations.filter((entity) => {
      if (selectedTagId !== "all" && !entity.tags.some((tag) => String(tag.id) === selectedTagId)) {
        return false;
      }
      if (normalizedQuery.length > 0 && !entity.name.toLocaleLowerCase().includes(normalizedQuery)) {
        return false;
      }
      return true;
    });
  }, [locations, nameQuery, selectedTagId]);
  const locationEntities = useMemo<LocationEntity[]>(
    () => locations.map((entity) => ({ id: entity.id, name: entity.name, ...entity.location })),
    [locations]
  );
  const filteredLocationEntities = useMemo<LocationEntity[]>(
    () => filteredLocations.map((entity) => ({ id: entity.id, name: entity.name, ...entity.location })),
    [filteredLocations]
  );
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedEntityId) ?? null,
    [locations, selectedEntityId]
  );
  const displayName = selectedEntity?.name ?? selectedLocation?.name ?? "";
  const displayKindLabel = selectedEntity?.kind.label ?? selectedLocation?.kind.label ?? "";
  const displayDescription = selectedEntity?.description ?? null;
  const displayTags = selectedEntity?.tags ?? selectedLocation?.tags ?? [];

  function focusEntityOnMap(entityId: string) {
    const map = mapRef.current;
    const target = filteredLocationEntities.find((entity) => entity.id === entityId);
    if (!map || !target) {
      return;
    }
    map.setView([target.latitude, target.longitude], SINGLE_MARKER_ZOOM, {
      animate: true
    });
  }

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
        setSelectedEntityId(entity.id);
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
  }, [filteredLocationEntities]);

  return (
    <main className="mx-auto grid h-[calc(100dvh-env(safe-area-inset-bottom)-3rem)] w-full max-w-3xl box-border grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-3 overflow-hidden px-4 pb-0 pt-16">
      {error && <p className="text-sm text-destructive">地図データの取得に失敗しました。</p>}

      <section className="space-y-2 rounded-lg border bg-card p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">タグ</span>
            <Select
              className="h-8 px-2 text-xs md:text-xs"
              value={selectedTagId}
              onChange={(event) => setSelectedTagId(event.target.value)}
            >
              <option value="all">すべて</option>
              {tagOptions.map((tag) => (
                <option key={tag.id} value={String(tag.id)}>
                  {tag.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">名前検索</span>
            <Input
              className="h-8 px-2 text-base md:text-sm"
              value={nameQuery}
              onChange={(event) => setNameQuery(event.target.value)}
              placeholder="キーワードを入力"
            />
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>総件数 {locationEntities.length} 件 / 表示中 {filteredLocationEntities.length} 件</p>
        <p>{isLoading ? "検索中..." : ""}</p>
      </div>

      <div className="isolate relative z-0">
        <div
          ref={mapContainerRef}
          className="h-[24dvh] min-h-40 w-full overflow-hidden rounded-xl border border-border/70 bg-card/95 md:h-[36dvh] md:min-h-64"
        />
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/60">
            <div className="w-full max-w-xs space-y-2 px-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        )}
      </div>

      {locationEntities.length === 0 && (
        <div className="h-full overflow-y-auto rounded-md border border-border/70 bg-muted p-3 text-sm text-muted-foreground">
          位置情報付きの嗜好がまだありません。
        </div>
      )}

      {locationEntities.length > 0 && filteredLocationEntities.length === 0 && (
        <div className="h-full overflow-y-auto space-y-2 rounded-md border border-border/70 bg-muted p-3 text-sm text-muted-foreground">
          <p>条件に一致する嗜好がありません。</p>
        </div>
      )}

      {filteredLocationEntities.length > 0 && (
        <div className="h-full overflow-y-auto rounded-xl border border-border/70 bg-card/95 p-2">
          <ul className="space-y-2 text-sm">
            {filteredLocationEntities.map((entity) => (
              <li key={entity.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-border/70 bg-card/95 p-2 text-left transition-colors hover:bg-accent/35"
                  onClick={() => {
                    focusEntityOnMap(entity.id);
                  }}
                >
                  <p className="font-medium">{entity.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {filteredLocations
                      .find((location) => location.id === entity.id)
                      ?.tags.slice(0, 3)
                      .map((tag) => (
                        <span key={tag.id} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                          {tag.name}
                        </span>
                      ))}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ModalShell
        open={selectedEntityId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntityId(null);
          }
        }}
        ariaLabel="嗜好の詳細"
        contentClassName="max-w-lg"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">嗜好の詳細</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedEntityId(null);
              }}
            >
              閉じる
            </Button>
          </div>

          {isSelectedEntityLoading && (
            <div className="space-y-3" aria-hidden="true">
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-16 w-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          )}

          {!isSelectedEntityLoading && selectedLocation && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">名前</p>
                <p>{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">種別</p>
                <p>{displayKindLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">説明</p>
                <p>{displayDescription && displayDescription.length > 0 ? displayDescription : "未設定"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">タグ</p>
                {displayTags.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {displayTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                        onClick={() => {
                          setSelectedTagId(String(tag.id));
                          setNameQuery("");
                          setSelectedEntityId(null);
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>なし</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">画像</p>
                {isSelectedEntityImagesLoading ? (
                  <Skeleton className="mt-1 h-40 w-full" />
                ) : selectedEntityImages.length > 0 ? (
                  <div className="mt-1 space-y-2">
                    <img
                      src={selectedEntityImages[0]?.url}
                      alt={selectedEntityImages[0]?.fileName ?? `${displayName} の画像`}
                      className="h-40 w-full rounded-md border object-cover"
                    />
                    <p className="text-xs text-muted-foreground">全 {selectedEntityImages.length} 枚</p>
                  </div>
                ) : (
                  <p>なし</p>
                )}
              </div>
            </div>
          )}
        </div>
      </ModalShell>
    </main>
  );
}
