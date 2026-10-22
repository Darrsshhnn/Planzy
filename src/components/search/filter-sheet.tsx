"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/api/data";
import { TIME_SLOTS } from "@/lib/time";
import type { Category, TimeSlot } from "@/lib/types";

export type Sort = "rating" | "distance" | "price";
export type When = TimeSlot | "now";

export interface Filters {
  sort: Sort;
  category: Category | null;
  maxKm: number | null;
  when: When | null;
}

export const NO_FILTERS: Filters = { sort: "rating", category: null, maxKm: null, when: null };

const SORTS: { id: Sort; label: string }[] = [
  { id: "rating", label: "Top rated" },
  { id: "distance", label: "Nearest" },
  { id: "price", label: "Budget" },
];
const DISTANCES = [5, 10, 15];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 first:mt-0">
      <h3 className="text-[13px] font-semibold">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

/** Filter mini screen: one choice per group, tap again to clear it. */
export function FilterSheet({
  open,
  initial,
  countFor,
  onApply,
  onClose,
}: {
  open: boolean;
  initial: Filters;
  /** Live result count for the draft, shown on the apply button. */
  countFor: (f: Filters) => number;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setDraft((d) => ({ ...d, [key]: d[key] === value && key !== "sort" ? null : value }));
  const count = countFor(draft);

  return (
    <Sheet open={open} onClose={onClose} title="Filters">
      <Group title="Sort by">
        {SORTS.map((s) => (
          <Chip key={s.id} selected={draft.sort === s.id} onClick={() => set("sort", s.id)}>
            {s.label}
          </Chip>
        ))}
      </Group>
      <Group title="Category">
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={draft.category === c} onClick={() => set("category", c)}>
            {c}
          </Chip>
        ))}
      </Group>
      <Group title="Distance">
        {DISTANCES.map((km) => (
          <Chip key={km} selected={draft.maxKm === km} onClick={() => set("maxKm", km)}>
            Within {km} km
          </Chip>
        ))}
      </Group>
      <Group title="When">
        <Chip selected={draft.when === "now"} onClick={() => set("when", "now")}>
          Open now
        </Chip>
        {TIME_SLOTS.map((t) => (
          <Chip key={t} selected={draft.when === t} onClick={() => set("when", t)}>
            {t}
          </Chip>
        ))}
      </Group>

      <div className="mt-6 flex gap-2">
        <Button variant="outline" size="md" onClick={() => setDraft(NO_FILTERS)} className="shrink-0">
          Reset
        </Button>
        <Button
          size="md"
          block
          disabled={count === 0}
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          {count === 0 ? "No places match" : `Show ${count} place${count === 1 ? "" : "s"}`}
        </Button>
      </div>
    </Sheet>
  );
}
