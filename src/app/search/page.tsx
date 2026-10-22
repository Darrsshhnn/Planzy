"use client";

import { Compass, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceImage } from "@/components/place/place-image";
import { useNow } from "@/components/place/live-status";
import { PlaceListRow } from "@/components/place/place-list-row";
import { FilterSheet, NO_FILTERS, type Filters } from "@/components/search/filter-sheet";
import { FieldBox } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getNewPlaces, getPlace, getPlaces, getRecents, searchPlaces } from "@/lib/api/data";
import { isOpenAt, isOpenDuring } from "@/lib/time";

/** Areas with places you haven't been to on a past outing ("New area exploration"). */
function newAreas() {
  const visited = new Set(getRecents().map((r) => getPlace(r.placeId)?.area));
  return [...new Set(getPlaces().map((p) => p.area))].filter((a) => !visited.has(a));
}

/** Explore + the Recommendation filters: categories, distance, time, open now. */
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Clock is only known in the browser; "Open now" is skipped while prerendering.
  const now = useNow();
  const apply = (f: Filters) => {
    const minute = now ? now.getHours() * 60 + now.getMinutes() : null;
    return searchPlaces(query, f.category)
      .filter((p) => f.maxKm === null || p.distanceKm <= f.maxKm)
      .filter((p) => f.when === null || (f.when === "now" ? minute === null || isOpenAt(p, minute) : isOpenDuring(p, f.when)))
      .sort((a, b) =>
        f.sort === "rating"
          ? b.rating - a.rating
          : f.sort === "distance"
            ? a.distanceKm - b.distanceKm
            : a.pricePerPerson - b.pricePerPerson,
      );
  };
  const results = apply(filters);

  const active: { label: string; clear: () => void }[] = [
    filters.category && { label: filters.category, clear: () => setFilters((f) => ({ ...f, category: null })) },
    filters.maxKm && { label: `Within ${filters.maxKm} km`, clear: () => setFilters((f) => ({ ...f, maxKm: null })) },
    filters.when && {
      label: filters.when === "now" ? "Open now" : filters.when,
      clear: () => setFilters((f) => ({ ...f, when: null })),
    },
  ].filter((x): x is { label: string; clear: () => void } => !!x);
  const activeFilters = active.length;
  const SORT_LABEL = { rating: "Top rated", distance: "Nearest", price: "Budget" } as const;

  return (
    <Screen
      overlay={
        filtersOpen && (
          <FilterSheet
            open
            initial={filters}
            countFor={(f) => apply(f).length}
            onApply={setFilters}
            onClose={() => setFiltersOpen(false)}
          />
        )
      }
    >
      <PageHeader title="Explore" backHref="/" />
      <div className="flex gap-2">
        <FieldBox className="flex h-[48px] min-w-0 flex-1 items-center gap-2 px-4">
          <Search size={22} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places in Ahmedabad"
            aria-label="Search places"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/40"
          />
        </FieldBox>
        <button
          onClick={() => setFiltersOpen(true)}
          aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}
          className="card relative flex h-[48px] w-[48px] shrink-0 items-center justify-center bg-cream!"
        >
          <SlidersHorizontal size={22} />
          {activeFilters > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>
      {activeFilters > 0 && (
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {active.map((a) => (
            <button
              key={a.label}
              onClick={a.clear}
              className="flex h-[30px] shrink-0 items-center gap-1 rounded-full bg-ink px-3 text-[13px] text-brand"
            >
              {a.label} <X size={14} />
            </button>
          ))}
        </div>
      )}

      {!query && activeFilters === 0 && (
        <>
          <section className="mt-4">
            <h2 className="flex items-center gap-1.5 font-heading text-[17px] font-bold">
              <Sparkles size={17} className="text-brand" /> New spots this week
            </h2>
            <div className="no-scrollbar -mx-5 mt-2 flex gap-3 overflow-x-auto px-5">
              {getNewPlaces().map((p) => (
                <Link
                  key={p.id}
                  href={`/place/${p.id}`}
                  className="relative block h-[110px] w-[180px] shrink-0 overflow-hidden card-dark"
                >
                  <PlaceImage place={p} className="absolute inset-0 h-full w-full" sizes="180px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                  <span className="absolute left-2 top-2 rounded-full bg-brand px-2 text-[9px] font-semibold leading-[16px] text-white">
                    NEW
                  </span>
                  <div className="absolute inset-x-2 bottom-1.5 text-white">
                    <p className="truncate text-[12px] font-semibold">{p.name}</p>
                    <p className="truncate text-[10px] text-white/80">
                      {p.area} · {p.distanceKm} km
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="mt-4">
            <h2 className="flex items-center gap-1.5 font-heading text-[17px] font-bold">
              <Compass size={17} className="text-brand" /> Explore a new area
            </h2>
            <p className="text-[11px] text-muted">Areas you haven&apos;t been to on a Planzy outing</p>
            <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5">
              {newAreas().map((a) => (
                <Chip key={a} onClick={() => setQuery(a)}>
                  {a}
                </Chip>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="mt-4 flex items-center justify-between text-[12px] text-muted">
        <span>{results.length} places</span>
        <span>Sorted by {SORT_LABEL[filters.sort].toLowerCase()}</span>
      </div>
      <ul className="mt-1 divide-y divide-ink/10">
        {results.map((p) => (
          <PlaceListRow key={p.id} place={p} />
        ))}
        {results.length === 0 && <li className="py-10 text-center text-[13px] text-muted">No places match. Try fewer filters.</li>}
      </ul>
    </Screen>
  );
}
