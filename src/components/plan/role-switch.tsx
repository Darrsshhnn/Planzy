"use client";

import { getPerson } from "@/lib/api/data";
import { usePlan } from "@/store/plan-store";
import { setRole, useViewer } from "@/store/viewer-store";

/**
 * Demo control: see the shared screens as the group admin or as a member.
 * Open two tabs with different roles to watch the waiting state update live.
 */
export function RoleSwitch() {
  const plan = usePlan();
  const { role, viewerId } = useViewer();
  if (plan.memberIds.length < 2) return null;
  return (
    <div className="flex items-center justify-between gap-2 rounded-full border border-ink/15 bg-paper py-1 pl-3 pr-1 text-[11px]">
      <span className="truncate text-muted">
        Viewing as <span className="font-semibold text-ink">{getPerson(viewerId).name}</span>
      </span>
      <div className="flex shrink-0 rounded-full bg-cream p-0.5">
        {(["admin", "member"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            aria-pressed={role === r}
            className={`rounded-full px-2.5 py-1 font-semibold capitalize ${role === r ? "bg-ink text-white" : "text-ink"}`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
