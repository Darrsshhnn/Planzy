import { hash } from "@/lib/format";
import type { Place, PlanState, Vote } from "@/lib/types";

export interface Tally {
  in: string[];
  maybe: string[];
  cant: string[];
  pending: string[];
  score: number;
}

export const VOTE_LABEL: Record<Vote, string> = { in: "In", maybe: "Maybe", cant: "Can't" };

export function tally(plan: Pick<PlanState, "votes" | "memberIds">, placeId: string): Tally {
  const votes = plan.votes[placeId] ?? {};
  const t: Tally = { in: [], maybe: [], cant: [], pending: [], score: 0 };
  for (const id of plan.memberIds) {
    const v = votes[id];
    if (v) t[v].push(id);
    else t.pending.push(id);
  }
  t.score = t.in.length * 2 + t.maybe.length;
  return t;
}

/** Shortlist sorted by vote score, then by rating as a tie-breaker. */
export function rankShortlist(
  plan: Pick<PlanState, "votes" | "memberIds" | "shortlist">,
  getPlace: (id: string) => Place | undefined,
) {
  return plan.shortlist
    .map((id) => ({ place: getPlace(id)!, tally: tally(plan, id) }))
    .filter((r) => r.place)
    .sort((a, b) => b.tally.score - a.tally.score || b.place.rating - a.place.rating);
}

/** How a simulated friend votes: stable per friend+place, nudged by fit. */
export function simulatedVote(friendId: string, place: Place, plan: Pick<PlanState, "budget" | "distance">): Vote {
  let v = hash(friendId + place.id) % 7;
  if (place.pricePerPerson <= plan.budget) v += 2;
  if (place.distanceKm <= plan.distance) v += 1;
  if (place.rating >= 4.3) v += 1;
  if (v >= 7) return "in";
  if (v >= 4) return "maybe";
  return "cant";
}
