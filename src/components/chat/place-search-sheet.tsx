"use client";

import { Check, Heart, Plus, Search } from "lucide-react";
import { useState } from "react";
import { PlaceImage } from "@/components/place/place-image";
import { FieldBox } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { CATEGORIES, getPlace, searchPlaces } from "@/lib/api/data";
import { rupees } from "@/lib/format";
import type { Category } from "@/lib/types";

/** Add places to the group's shortlist: search everything, or pick from places you liked. */
export function PlaceSearchSheet({
  open,
  onClose,
  shortlist,
  liked,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  shortlist: string[];
  /** Your favourited places. */
  liked: string[];
  onAdd: (placeId: string) => void;
}) {
  const [tab, setTab] = useState<"search" | "liked">("search");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const results =
    tab === "liked" ? liked.map((id) => getPlace(id)).filter((p) => p !== undefined) : searchPlaces(query, category);

  return (
    <Sheet open={open} onClose={onClose} title="Add a place">
      <div className="mb-3 grid grid-cols-2 rounded-full bg-cream p-1" role="tablist">
        {(
          [
            ["search", "Search", Search],
            ["liked", `Liked places (${liked.length})`, Heart],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold ${tab === id ? "bg-ink text-white" : "text-ink"}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {tab === "search" && (
        <>
      <FieldBox className="flex h-[46px] items-center gap-2 px-4">
        <Search size={20} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search turf, cafe, museum..."
          aria-label="Search places"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink/40"
        />
      </FieldBox>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={category === c} onClick={() => setCategory(category === c ? null : c)}>
            {c}
          </Chip>
        ))}
      </div>
        </>
      )}
      <ul className="mt-3 divide-y divide-ink/10">
        {results.map((p) => {
          const added = shortlist.includes(p.id);
          return (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <PlaceImage place={p} className="h-[52px] w-[60px] shrink-0 rounded-[8px]" sizes="60px" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{p.name}</p>
                <p className="truncate text-[11px] text-muted">
                  {p.distanceKm} km · {p.area} · {rupees(p.pricePerPerson)}/person · Rated {p.rating.toFixed(1)}
                </p>
              </div>
              <button
                disabled={added}
                onClick={() => {
                  onAdd(p.id);
                  onClose();
                }}
                className={[
                  "flex h-[32px] shrink-0 items-center gap-1 rounded-full border px-3 text-[12px] font-semibold",
                  added ? "border-ink/20 text-muted" : "border-brand bg-brand text-white",
                ].join(" ")}
              >
                {added ? <Check size={14} /> : <Plus size={14} />}
                {added ? "Added" : "Add"}
              </button>
            </li>
          );
        })}
        {results.length === 0 && (
          <li className="py-8 text-center text-[13px] text-muted">
            {tab === "liked" ? "Tap the heart on any place to see it here." : "No places match."}
          </li>
        )}
      </ul>
    </Sheet>
  );
}
