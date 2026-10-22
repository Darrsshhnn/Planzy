import { getPlaces } from "@/lib/api/data";
import { isOpenDuring } from "@/lib/time";
import type { Place, PlanState } from "@/lib/types";

export interface Recommendation {
  place: Place;
  score: number;
  /** Fails at least one hard filter; shown only to reach the minimum count. */
  relaxed: boolean;
  reasons: string[];
  /** Preference matching: how well the place fits the group, 0-100. */
  match: number;
}

export const MIN_RECOMMENDATIONS = 3;

type Prefs = Pick<PlanState, "categories" | "budget" | "distance" | "timeSlot" | "onlyOpen">;

function evaluate(place: Place, prefs: Prefs): Recommendation {
  const reasons: string[] = [];
  let score = place.rating;
  let relaxed = false;

  const categoryMatch = prefs.categories.length === 0 || prefs.categories.includes(place.category);
  if (categoryMatch) score += 3;
  else {
    relaxed = true;
    reasons.push(`${place.category}, not in your categories`);
  }

  if (place.pricePerPerson <= prefs.budget) score += 2;
  else {
    relaxed = true;
    score -= (place.pricePerPerson - prefs.budget) / 200;
    reasons.push("Slightly over budget");
  }

  if (place.distanceKm <= prefs.distance) score += 2;
  else {
    relaxed = true;
    score -= (place.distanceKm - prefs.distance) / 5;
    reasons.push("A little farther");
  }

  const open = isOpenDuring(place, prefs.timeSlot);
  if (open) score += 1;
  else if (prefs.onlyOpen) {
    relaxed = true;
    score -= 3;
    reasons.push(`Closed in the ${prefs.timeSlot.toLowerCase()}`);
  }

  return { place, score, relaxed, reasons, match: matchPercent(place, prefs) };
}

/**
 * Weighted fit: category 30, budget 25, distance 25, timing 20. Inside the limits,
 * cheaper and closer score higher; past them, credit drops off quickly.
 */
export function matchPercent(place: Place, prefs: Prefs) {
  const category = prefs.categories.length === 0 || prefs.categories.includes(place.category) ? 30 : 6;
  const priceRatio = place.pricePerPerson / Math.max(prefs.budget, 1);
  const budget = priceRatio <= 1 ? 25 * (1 - 0.3 * priceRatio) : 17.5 * Math.max(0, 1 - (priceRatio - 1) * 1.5);
  const kmRatio = place.distanceKm / Math.max(prefs.distance, 1);
  const distance = kmRatio <= 1 ? 25 * (1 - 0.3 * kmRatio) : 17.5 * Math.max(0, 1 - (kmRatio - 1) * 1.5);
  const timing = isOpenDuring(place, prefs.timeSlot) ? 20 : 4;
  return Math.round(category + budget + distance + timing);
}

/**
 * Ranks places against the group's preferences. Strict matches come first;
 * if there are fewer than three, the closest near-misses fill the list.
 */
export function recommend(prefs: Prefs, limit = 5): Recommendation[] {
  const all = getPlaces()
    .map((p) => evaluate(p, prefs))
    .sort((a, b) => b.score - a.score);
  const strict = all.filter((r) => !r.relaxed);
  const relaxed = all.filter((r) => r.relaxed);
  const size = Math.max(MIN_RECOMMENDATIONS, Math.min(limit, strict.length));
  return [...strict, ...relaxed].slice(0, size);
}
