"use client";

import { CalendarClock, Camera, Sparkles, Users } from "lucide-react";
import { formatAgo, photoAges } from "@/lib/live";
import type { Place } from "@/lib/types";
import { AvailabilityChip, OpenNow } from "./live-status";
import { Photo } from "./photo";

const CROWD_BARS: Record<Place["live"]["crowd"], number> = { Quiet: 1, Moderate: 2, Busy: 3 };

/** Live footage & images + availability + best time (FigJam: "Opening a card"). */
export function LiveSection({ place, onOpenPhoto }: { place: Place; onOpenPhoto: (index: number) => void }) {
  const ages = photoAges(place);
  const level = CROWD_BARS[place.live.crowd];
  return (
    <section className="reveal card-dark mt-5 p-3.5 text-white">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-[17px] font-bold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff5b5b] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff5b5b]" />
          </span>
          Live now
        </h2>
        <span className="text-[11px] text-white/70">Updated {formatAgo(place.live.updatedMinsAgo)}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[10px] bg-white/10 p-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-white/70">
            <Users size={13} /> Crowd
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[14px] font-semibold">{place.live.crowd}</span>
            <span className="flex items-end gap-0.5" aria-hidden>
              {[1, 2, 3].map((b) => (
                <span
                  key={b}
                  className={`w-1.5 rounded-sm ${b <= level ? "bg-brand" : "bg-white/25"}`}
                  style={{ height: 4 + b * 4 }}
                />
              ))}
            </span>
          </div>
        </div>
        <div className="rounded-[10px] bg-white/10 p-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-white/70">
            <CalendarClock size={13} /> Availability
          </p>
          <AvailabilityChip place={place} className="mt-1.5" />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 rounded-[10px] bg-white/10 px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-[12px]">
          <Sparkles size={13} className="text-brand" /> Least crowded: {place.bestTime}
        </span>
      </div>
      <OpenNow place={place} className="mt-2 !text-[#7ee2a5]" />

      <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold">
        <Camera size={14} /> Recent visitor photos
      </p>
      <div className="no-scrollbar -mx-3.5 mt-2 flex snap-x snap-mandatory scroll-px-3.5 gap-2 overflow-x-auto px-3.5 [&>*]:snap-start">
        {place.gallery.map((src, i) => (
          <button
            key={src}
            onClick={() => onOpenPhoto(i)}
            className="relative h-[86px] w-[120px] shrink-0 overflow-hidden rounded-[8px]"
            aria-label={`Visitor photo, ${formatAgo(ages[i])}`}
          >
            <Photo src={src} alt="" sizes="120px" />
            <span className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-1.5 text-[9px] leading-[15px]">
              {formatAgo(ages[i])}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const SCORE_LABELS: [keyof Place["scores"], string][] = [
  ["cleanliness", "Cleanliness"],
  ["maintenance", "Well maintained"],
  ["value", "Value for money"],
  ["staff", "Staff & service"],
];

/** Sub-ratings from verified reviews (affinity map: cleanliness, well maintained). */
export function ScoreBars({ place }: { place: Place }) {
  return (
    <dl className="mt-3 space-y-2">
      {SCORE_LABELS.map(([key, label]) => {
        const v = place.scores[key];
        return (
          <div key={key} className="grid grid-cols-[110px_1fr_28px] items-center gap-2 text-[12px]">
            <dt className="text-ink/80">{label}</dt>
            <dd className="h-[6px] overflow-hidden rounded-full bg-ink/10">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${(v / 5) * 100}%` }} />
            </dd>
            <dd className="text-right font-semibold">{v.toFixed(1)}</dd>
          </div>
        );
      })}
    </dl>
  );
}
