"use client";

import { Check, ChevronDown, Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { areaLabel, currentPosition, nearestArea, searchAreas } from "@/lib/geo";
import type { Area } from "@/lib/types";

/**
 * Searchable dropdown of every area in Ahmedabad and Gandhinagar, grouped by
 * city, with "Use my current location" on top. `value` is "Area, City".
 */
export function LocationPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (label: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const root = useRef<HTMLDivElement>(null);

  // Close when tapping outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const results = searchAreas(query);
  const groups = (["Ahmedabad", "Gandhinagar"] as const)
    .map((city) => ({ city, areas: results.filter((a) => a.city === city) }))
    .filter((g) => g.areas.length);

  const pick = (a: Area) => {
    onChange(areaLabel(a));
    setOpen(false);
    setQuery("");
    setGeoError("");
  };

  const useMine = async () => {
    setLocating(true);
    const pos = await currentPosition();
    setLocating(false);
    if (!pos) return setGeoError("Couldn't get your location here. Search your area instead.");
    pick(nearestArea({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-[52px] w-full items-center gap-2 rounded-[14px] border-[1.5px] bg-white/90 px-4 text-left ${
          error ? "border-red-500" : open ? "border-brand" : "border-ink"
        }`}
      >
        <MapPin size={19} className="shrink-0 text-brand" />
        <span className={`min-w-0 flex-1 truncate text-[16px] ${value ? "text-ink" : "text-ink/45"}`}>
          {value || "Select your area"}
        </span>
        <ChevronDown size={20} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {(error || geoError) && !open && <p className="mt-1 text-[12px] text-red-600">{error || geoError}</p>}

      {open && (
        <div className="card absolute inset-x-0 top-[58px] z-30 overflow-hidden bg-white! p-0!">
          <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2.5">
            <Search size={17} className="text-ink/60" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search areas in Ahmedabad & Gandhinagar"
              aria-label="Search areas"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/40"
            />
          </div>
          <ul role="listbox" aria-label="Areas" className="no-scrollbar max-h-[290px] overflow-y-auto py-1">
            {!query && (
              <li>
                <button
                  type="button"
                  onClick={useMine}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] font-semibold text-brand hover:bg-cream"
                >
                  {locating ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
                  Use my current location
                </button>
              </li>
            )}
            {groups.map((g) => (
              <li key={g.city}>
                <p className="sticky top-0 bg-white px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {g.city}
                </p>
                <ul>
                  {g.areas.map((a) => {
                    const label = areaLabel(a);
                    const selected = label === value;
                    return (
                      <li key={label} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          onClick={() => pick(a)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[15px] hover:bg-cream ${selected ? "font-semibold text-brand" : ""}`}
                        >
                          {a.name}
                          {selected && <Check size={16} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
            {groups.length === 0 && (
              <li className="px-4 py-6 text-center text-[13px] text-muted">No area called &ldquo;{query}&rdquo;</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
