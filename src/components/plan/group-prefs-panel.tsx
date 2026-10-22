"use client";

import { Clock, Loader2, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { getPerson } from "@/lib/api/data";
import { groupPrefs } from "@/lib/group-prefs";
import type { PlanState } from "@/lib/types";

/**
 * What the group sent so far and the average Planzy uses for suggestions.
 * Updates live as invited friends accept and send their input.
 */
export function GroupPrefsPanel({ plan }: { plan: PlanState }) {
  const g = groupPrefs(plan);
  const rows = [...g.contributors.filter((id) => id !== plan.adminId)].map((id) => ({ id, prefs: plan.memberPrefs[id]! }));

  return (
    <section className="card mt-5 p-3.5" aria-live="polite">
      <h3 className="flex items-center gap-1.5 text-[14px] font-semibold">
        <Users size={16} className="text-brand" /> Group average
      </h3>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          ["Budget", `₹${g.budget}`],
          ["Distance", `${g.distance} km`],
          ["Timing", g.timeSlot],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] bg-cream py-2">
            <dt className="text-[10px] text-muted">{label}</dt>
            <dd className="text-[14px] font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] text-muted">
        From {g.contributors.length} {g.contributors.length === 1 ? "person" : "people"}
        {g.skipped.length > 0 && ` · ${g.skipped.length} skipped`}
        {g.slotVotes > 0 && ` · ${g.slotVotes} prefer ${g.timeSlot.toLowerCase()}`}
      </p>

      {rows.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {rows.map(({ id, prefs }) => (
            <li key={id} className="flex items-center gap-2 text-[12px]">
              <Avatar personId={id} size={24} />
              <span className="w-[64px] truncate font-medium">{getPerson(id).name}</span>
              <span className="text-ink/80">
                ₹{prefs.budget} · {prefs.distance} km · {prefs.timeSlot}
              </span>
            </li>
          ))}
        </ul>
      )}
      {g.waiting.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#a2610a]">
          <Loader2 size={13} className="animate-spin" />
          Waiting for {g.waiting.length} {g.waiting.length === 1 ? "reply" : "replies"}
        </p>
      )}
      {g.waiting.length === 0 && rows.length === 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
          <Clock size={13} /> No input from friends yet
        </p>
      )}
    </section>
  );
}
