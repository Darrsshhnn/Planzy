"use client";

import { ChevronLeft, Loader2, LocateFixed, Navigation, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AvailabilityChip, LivePill } from "@/components/place/live-status";
import { PlaceImage } from "@/components/place/place-image";
import { RatingBadge } from "@/components/ui/rating";
import { getPlace, getPlaces } from "@/lib/api/data";
import { mapsUrl, priceLabel } from "@/lib/format";
import { findArea, getAreas, kmBetween, nearestArea } from "@/lib/geo";
import { useProfile } from "@/store/account-store";
import { LiveMap, type LiveMapHandle } from "./live-map";

const AREA_RADIUS_KM = 3;

/** Asks OpenStreetMap for anything that isn't one of our known areas. */
async function geocode(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=72.40,23.20,72.75,22.90&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), name: hit.display_name.split(",")[0] } : null;
  } catch {
    return null;
  }
}

/** In-app map: your live location, the area around it, and what's on there. */
export function MapScreen({ focusPlaceId }: { focusPlaceId?: string }) {
  const router = useRouter();
  const profile = useProfile();
  const mapRef = useRef<LiveMapHandle>(null);
  const places = getPlaces();
  const [selectedId, setSelectedId] = useState<string | null>(focusPlaceId ?? null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [user, setUser] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState("");
  const centred = useRef(false);

  const selected = getPlace(selectedId);

  // Follow the user's live position; the first fix centres the map (unless a place is focused).
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setUser(next);
        if (!centred.current && !focusPlaceId) {
          centred.current = true;
          mapRef.current?.flyTo(next.lat, next.lng, 14);
        }
      },
      () => setNotice("Live location needs https and permission. Showing your profile area."),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [focusPlaceId]);

  // Opened from a place card: centre on that place.
  useEffect(() => {
    const p = getPlace(focusPlaceId);
    if (!p) return;
    const t = setTimeout(() => mapRef.current?.flyTo(p.lat, p.lng, 15), 300);
    return () => clearTimeout(t);
  }, [focusPlaceId]);

  // No GPS: start from the area in your profile.
  useEffect(() => {
    if (!notice || focusPlaceId || centred.current) return;
    const area = findArea(profile.location);
    if (area) mapRef.current?.flyTo(area.lat, area.lng, 14);
    centred.current = true;
  }, [notice, profile.location, focusPlaceId]);

  const locateMe = () => {
    if (user) mapRef.current?.flyTo(user.lat, user.lng, 15);
    else {
      const area = findArea(profile.location);
      setNotice("Live location isn't available here. Showing your profile area.");
      if (area) mapRef.current?.flyTo(area.lat, area.lng, 14);
    }
  };

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    // An exact area name wins; then a place by name; then a partial area match.
    const exactArea = getAreas().find((a) => a.name.toLowerCase() === q.toLowerCase());
    const place = exactArea ? undefined : places.find((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (place) {
      setSelectedId(place.id);
      mapRef.current?.flyTo(place.lat, place.lng, 15);
      return;
    }
    const area = exactArea ?? findArea(q);
    if (area) {
      setSelectedId(null);
      mapRef.current?.flyTo(area.lat, area.lng, 14);
      return;
    }
    setSearching(true);
    const hit = await geocode(`${q}, Ahmedabad`);
    setSearching(false);
    if (hit) {
      setSelectedId(null);
      mapRef.current?.flyTo(hit.lat, hit.lng, 14);
    } else setNotice(`Couldn't find "${q}" in Ahmedabad.`);
  };

  const areaName = center ? nearestArea(center).name : "Ahmedabad";
  const around = center
    ? places
        .map((p) => ({ p, km: kmBetween(center, p) }))
        .filter((x) => x.km <= AREA_RADIUS_KM)
        .sort((a, b) => a.km - b.km)
    : [];

  return (
    <div className="absolute inset-0">
      <LiveMap
        ref={mapRef}
        places={places}
        selectedId={selectedId}
        user={user}
        onSelect={(id) => setSelectedId(id)}
        onMove={setCenter}
      />

      {/* Top bar: back, area search */}
      <div className="absolute inset-x-0 top-0 z-[500] flex gap-2 px-4 pt-4">
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/search"))}
          aria-label="Back"
          className="card flex h-11 w-11 shrink-0 items-center justify-center bg-cream!"
        >
          <ChevronLeft size={22} />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          className="card flex h-11 min-w-0 flex-1 items-center gap-2 px-3"
        >
          {searching ? <Loader2 size={18} className="animate-spin text-brand" /> : <Search size={18} />}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            list="planzy-map-areas"
            placeholder="Search an area or place"
            aria-label="Search an area or place"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink/40"
          />
          <datalist id="planzy-map-areas">
            {getAreas().map((a) => (
              <option key={a.name} value={a.name} />
            ))}
          </datalist>
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {notice && (
        <div className="absolute inset-x-4 top-[72px] z-[500] flex items-start gap-2 rounded-[10px] bg-ink/90 px-3 py-2 text-[12px] text-white">
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      <button
        onClick={locateMe}
        aria-label="Go to my location"
        className="card absolute bottom-[300px] right-4 z-[500] flex h-11 w-11 items-center justify-center bg-cream!"
      >
        <LocateFixed size={20} className={user ? "text-[#2b7fff]" : "text-ink"} />
      </button>

      {/* Bottom panel: selected place, or what's on in this area */}
      <section className="card absolute inset-x-3 bottom-[100px] z-[500] max-h-[190px] overflow-hidden p-3" aria-live="polite">
        {selected ? (
          <div className="flex gap-3">
            <div className="relative h-[92px] w-[100px] shrink-0 overflow-hidden rounded-[10px]">
              <PlaceImage place={selected} className="h-full w-full" sizes="100px" />
              <RatingBadge value={selected.rating} className="absolute bottom-1.5 right-1.5 !text-[10px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <h2 className="truncate font-heading text-[16px] font-bold">{selected.name}</h2>
                <button onClick={() => setSelectedId(null)} aria-label="Close" className="-mr-1 -mt-1 p-1">
                  <X size={16} />
                </button>
              </div>
              <p className="truncate text-[12px] text-muted">
                {selected.category} · {selected.area} · {priceLabel(selected)}
                {user ? ` · ${kmBetween(user, selected).toFixed(1)} km away` : ""}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                <LivePill place={selected} />
                <AvailabilityChip place={selected} />
              </div>
              <div className="mt-2 flex gap-2">
                <Link
                  href={`/place/${selected.id}`}
                  className="flex h-8 items-center rounded-full bg-ink px-3 text-[12px] font-semibold text-white"
                >
                  View place
                </Link>
                <a
                  href={mapsUrl(selected.name, selected.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 items-center gap-1 rounded-full border border-ink px-3 text-[12px] font-semibold"
                >
                  <Navigation size={13} /> Directions
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[14px] font-semibold">Around {areaName}</p>
            <p className="text-[11px] text-muted">
              {around.length
                ? `${around.length} place${around.length === 1 ? "" : "s"} within ${AREA_RADIUS_KM} km · tap one`
                : `Nothing within ${AREA_RADIUS_KM} km. Move the map or search another area.`}
            </p>
            <div className="no-scrollbar -mx-3 mt-2 flex snap-x snap-mandatory scroll-px-3 gap-2 overflow-x-auto px-3 pb-1 [&>*]:snap-start">
              {around.map(({ p, km }) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id);
                    mapRef.current?.flyTo(p.lat, p.lng, 15);
                  }}
                  className="card w-[150px] shrink-0 overflow-hidden text-left"
                >
                  <div className="relative">
                    <PlaceImage place={p} className="h-[64px] w-full" sizes="150px" />
                    <LivePill place={p} className="absolute left-1 top-1 !text-[9px]" />
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="truncate text-[12px] font-semibold">{p.name}</p>
                    <p className="text-[10px] text-muted">
                      {p.category} · {km.toFixed(1)} km
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
