import type { Place, TimeSlot } from "@/lib/types";

export const TIME_SLOTS: TimeSlot[] = ["Morning", "Afternoon", "Evening", "Night"];

/** Slot windows in minutes from midnight. */
const SLOT_WINDOWS: Record<TimeSlot, [number, number]> = {
  Morning: [7 * 60, 11 * 60],
  Afternoon: [12 * 60, 16 * 60],
  Evening: [16 * 60, 20 * 60],
  Night: [20 * 60, 24 * 60],
};

export const SLOT_LABELS: Record<TimeSlot, string> = {
  Morning: "7:00 AM - 11:00 AM",
  Afternoon: "12:00 PM - 4:00 PM",
  Evening: "4:00 PM - 8:00 PM",
  Night: "8:00 PM - 12:00 AM",
};

/** Hourly booking slots offered inside each window. */
export function bookingSlots(slot: TimeSlot): string[] {
  const [start, end] = SLOT_WINDOWS[slot];
  const out: string[] = [];
  for (let m = start; m < end; m += 60) out.push(formatMinutes(m));
  return out;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutes(total: number) {
  const m = total % (24 * 60);
  const h = Math.floor(m / 60);
  const mins = m % 60;
  const suffix = h >= 12 ? "P.M." : "A.M.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mins.toString().padStart(2, "0")} ${suffix}`;
}

/** "07:00" -> "7:00 A.M." */
export function formatTime(hhmm: string) {
  return formatMinutes(toMinutes(hhmm));
}

/** "07:00" -> "7 AM", "00:30" -> "12:30 AM" (compact, for cards). */
export function formatTimeShort(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${m.toString().padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`;
}

/** True when the place is open for at least two hours of the chosen window. */
export function isOpenDuring(place: Place, slot: TimeSlot) {
  const open = toMinutes(place.open);
  let close = toMinutes(place.close);
  if (close <= open) close += 24 * 60;
  const [start, end] = SLOT_WINDOWS[slot];
  const overlap = (s: number, e: number) => Math.max(0, Math.min(close, e) - Math.max(open, s));
  // Also check the window on the following day for places open past midnight.
  const best = Math.max(overlap(start, end), overlap(start + 1440, end + 1440));
  return best >= 120;
}

/** True when the place is open at the given minute of the day (0-1439). */
export function isOpenAt(place: Place, minuteOfDay: number) {
  const open = toMinutes(place.open);
  let close = toMinutes(place.close);
  if (close <= open) close += 24 * 60;
  return [minuteOfDay, minuteOfDay + 24 * 60].some((m) => m >= open && m < close);
}
