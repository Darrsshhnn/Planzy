import { getPerson } from "@/lib/api/data";
import { formatTime, isOpenAt, TIME_SLOTS } from "@/lib/time";
import type { Place, TimeSlot } from "@/lib/types";

export type Crowd = Place["live"]["crowd"];

export const CROWD_LEVEL: Record<Crowd, number> = { Quiet: 1, Moderate: 2, Busy: 3 };

/** Slot availability shown on cards, derived from the live crowd level. */
export function availability(place: Place): { label: string; tone: "good" | "warn" | "bad" } {
  if (place.live.crowd === "Busy") return { label: "Few slots left", tone: "bad" };
  if (place.live.crowd === "Moderate") return { label: "Filling up", tone: "warn" };
  return { label: "Slots open", tone: "good" };
}

/** "Open · closes 11:00 P.M." / "Closed · opens 5:00 P.M." for a given time. */
export function openStatus(place: Place, now: Date) {
  const open = isOpenAt(place, now.getHours() * 60 + now.getMinutes());
  return {
    open,
    label: open ? `Open · closes ${formatTime(place.close)}` : `Closed · opens ${formatTime(place.open)}`,
  };
}

/** "Most preferred time": the slot most of the group usually goes out in. */
export function suggestTimeSlot(memberIds: string[]): { slot: TimeSlot; count: number; total: number } | null {
  const counts = new Map<TimeSlot, number>();
  for (const id of memberIds) {
    const pref = getPerson(id).prefers;
    if (pref) counts.set(pref, (counts.get(pref) ?? 0) + 1);
  }
  let best: TimeSlot | null = null;
  for (const slot of TIME_SLOTS) if ((counts.get(slot) ?? 0) > (best ? counts.get(best)! : 0)) best = slot;
  return best ? { slot: best, count: counts.get(best)!, total: memberIds.length } : null;
}

/** Minutes-ago stamps for the recent visitor photos of a place. */
export function photoAges(place: Place) {
  const first = place.live.updatedMinsAgo;
  return place.gallery.map((_, i) => first + i * (35 + i * 20));
}

export function formatAgo(mins: number) {
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return `${h} hr${h > 1 ? "s" : ""} ago`;
}
