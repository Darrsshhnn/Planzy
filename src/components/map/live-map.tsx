"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { AHMEDABAD } from "@/lib/geo";
import type { Place } from "@/lib/types";

export interface LiveMapHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

const CATEGORY_COLOR: Record<Place["category"], string> = {
  Food: "#E5701B",
  Sports: "#2F8F6B",
  Arcade: "#7B6CF6",
  Fair: "#C2417A",
  Museum: "#8a6a4a",
  Hangout: "#19486E",
};

function pinHtml(place: Place, selected: boolean) {
  const color = CATEGORY_COLOR[place.category];
  return `<span class="planzy-pin${selected ? " is-selected" : ""}" style="--pin:${color}">
    <span class="planzy-pin-dot"></span>
    ${selected ? `<span class="planzy-pin-label">${place.name.replace(/</g, "&lt;")}</span>` : ""}
  </span>`;
}

/**
 * OpenStreetMap via Leaflet, loaded only in the browser. Shows every place as
 * a pin, the user's live position, and reports the visible centre on pan/zoom.
 */
export function LiveMap({
  places,
  selectedId,
  user,
  onSelect,
  onMove,
  ref,
}: {
  places: Place[];
  selectedId: string | null;
  user: { lat: number; lng: number; accuracy: number } | null;
  onSelect: (placeId: string) => void;
  onMove: (center: { lat: number; lng: number }) => void;
  ref?: Ref<LiveMapHandle>;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const markers = useRef<Map<string, Leaflet.Marker>>(new Map());
  const userLayer = useRef<Leaflet.LayerGroup | null>(null);
  const handlers = useRef({ onSelect, onMove });
  // Latest position, so it can be drawn even if it arrived before the map loaded.
  const userRef = useRef(user);

  useEffect(() => {
    handlers.current = { onSelect, onMove };
    userRef.current = user;
  });

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 14) => map.current?.flyTo([lat, lng], zoom, { duration: 0.8 }),
  }));

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    const pins = markers.current;
    (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !el.current || map.current) return;
      L.current = leaflet;
      const m = leaflet.map(el.current, { zoomControl: false, attributionControl: true }).setView(
        [AHMEDABAD.lat, AHMEDABAD.lng],
        12,
      );
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(m);
      leaflet.control.zoom({ position: "topright" }).addTo(m);
      m.on("moveend", () => {
        const c = m.getCenter();
        handlers.current.onMove({ lat: c.lat, lng: c.lng });
      });
      userLayer.current = leaflet.layerGroup().addTo(m);
      map.current = m;
      // Draw pins now that the map exists.
      syncMarkers();
      syncUser();
      handlers.current.onMove({ lat: AHMEDABAD.lat, lng: AHMEDABAD.lng });
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      pins.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncMarkers() {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m) return;
    const seen = new Set<string>();
    for (const p of places) {
      seen.add(p.id);
      const selected = p.id === selectedId;
      const icon = leaflet.divIcon({
        html: pinHtml(p, selected),
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const existing = markers.current.get(p.id);
      if (existing) {
        existing.setIcon(icon);
        existing.setZIndexOffset(selected ? 1000 : 0);
      } else {
        const marker = leaflet
          .marker([p.lat, p.lng], { icon, title: p.name, keyboard: true, zIndexOffset: selected ? 1000 : 0 })
          .on("click", () => handlers.current.onSelect(p.id))
          .addTo(m);
        markers.current.set(p.id, marker);
      }
    }
    for (const [id, marker] of markers.current) {
      if (!seen.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    }
  }

  function syncUser() {
    const leaflet = L.current;
    const layer = userLayer.current;
    if (!leaflet || !layer) return;
    layer.clearLayers();
    const user = userRef.current;
    if (!user) return;
    leaflet
      .circle([user.lat, user.lng], {
        radius: Math.min(user.accuracy, 1500),
        color: "#19486E",
        weight: 1,
        fillColor: "#19486E",
        fillOpacity: 0.12,
      })
      .addTo(layer);
    leaflet
      .marker([user.lat, user.lng], {
        icon: leaflet.divIcon({ html: '<span class="planzy-me"></span>', className: "", iconSize: [18, 18], iconAnchor: [9, 9] }),
        title: "You are here",
        zIndexOffset: 2000,
      })
      .addTo(layer);
  }

  useEffect(syncMarkers);
  useEffect(syncUser, [user]);

  return <div ref={el} className="isolate h-full w-full bg-[#e8e4dc]" role="application" aria-label="Map of places" />;
}
