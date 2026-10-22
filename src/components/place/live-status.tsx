"use client";

import { Radio } from "lucide-react";
import { useSyncExternalStore } from "react";
import { availability, openStatus } from "@/lib/live";
import type { Place } from "@/lib/types";

const TONE = {
  good: "bg-[#E3F7EA] text-[#1a7f45]",
  warn: "bg-[#FFF3DC] text-[#a2610a]",
  bad: "bg-[#FDE7E7] text-[#b42318]",
};

const subscribeMinute = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};

/** Current minute on the client; null while server-rendering (the clock is unknown there). */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
  return minute === null ? null : new Date(minute * 60_000);
}

/** Pulsing "Live · Busy" pill for photos. */
export function LivePill({ place, className = "" }: { place: Place; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff5b5b] opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff5b5b]" />
      </span>
      Live · {place.live.crowd}
    </span>
  );
}

/** Availability chip: "Slots open" / "Filling up" / "Few slots left". */
export function AvailabilityChip({ place, className = "" }: { place: Place; className?: string }) {
  const a = availability(place);
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE[a.tone]} ${className}`}>
      {a.label}
    </span>
  );
}

/** "Open · closes 11 PM", computed from the viewer's clock. */
export function OpenNow({ place, className = "" }: { place: Place; className?: string }) {
  const now = useNow();
  if (!now) return null;
  const s = openStatus(place, now);
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${s.open ? "text-[#1a7f45]" : "text-[#b42318]"} ${className}`}>
      <Radio size={12} />
      {s.label}
    </span>
  );
}
