import { TIME_SLOTS } from "@/lib/time";
import type { MemberPrefs, PlanState, TimeSlot } from "@/lib/types";

export interface GroupPrefs extends MemberPrefs {
  /** People whose input went into the average. */
  contributors: string[];
  /** Accepted members who skipped the input. */
  skipped: string[];
  /** Invites still waiting for a reply. */
  waiting: string[];
  /** How many contributors picked the chosen time slot. */
  slotVotes: number;
}

/**
 * Averages budget and distance across everyone who answered, and takes the
 * most popular time slot (ties go to the admin's choice). Members who skipped
 * don't count; if nobody answered, the admin's numbers are used.
 */
export function groupPrefs(plan: PlanState): GroupPrefs {
  const inputs: [string, MemberPrefs][] = [];
  const skipped: string[] = [];
  if (!plan.prefsSkipped) {
    inputs.push([plan.adminId, { budget: plan.budget, distance: plan.distance, timeSlot: plan.timeSlot }]);
  } else {
    skipped.push(plan.adminId);
  }
  for (const id of plan.memberIds) {
    if (id === plan.adminId) continue;
    const p = plan.memberPrefs[id];
    if (p) inputs.push([id, p]);
    else skipped.push(id);
  }
  const waiting = Object.entries(plan.invites)
    .filter(([, s]) => s === "invited")
    .map(([id]) => id);

  if (inputs.length === 0) {
    return {
      budget: plan.budget,
      distance: plan.distance,
      timeSlot: plan.timeSlot,
      contributors: [],
      skipped,
      waiting,
      slotVotes: 0,
    };
  }

  const avg = (pick: (p: MemberPrefs) => number) =>
    inputs.reduce((sum, [, p]) => sum + pick(p), 0) / inputs.length;
  const counts = new Map<TimeSlot, number>();
  for (const [, p] of inputs) counts.set(p.timeSlot, (counts.get(p.timeSlot) ?? 0) + 1);
  let slot: TimeSlot = plan.timeSlot;
  for (const t of TIME_SLOTS) if ((counts.get(t) ?? 0) > (counts.get(slot) ?? 0)) slot = t;

  return {
    budget: Math.round(avg((p) => p.budget) / 50) * 50,
    distance: Math.round(avg((p) => p.distance)),
    timeSlot: slot,
    contributors: inputs.map(([id]) => id),
    skipped,
    waiting,
    slotVotes: counts.get(slot) ?? 0,
  };
}
