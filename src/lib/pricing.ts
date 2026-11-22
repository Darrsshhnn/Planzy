import { CONVENIENCE_FEE } from "@/lib/api/payments";
import type { Place } from "@/lib/types";

/** Price for a booking: per hour for hourly sports, otherwise per person. */
export function quote(place: Place, people: number, hours = 1) {
  const subtotal = place.hourly ? place.hourly.rate * Math.max(hours, 1) : place.pricePerPerson * people;
  const total = subtotal + CONVENIENCE_FEE;
  return { subtotal, fee: CONVENIENCE_FEE, total, perPerson: Math.ceil(total / Math.max(people, 1)) };
}

/**
 * Places that charge to hold a slot (hourly sports courts/turfs, arcades,
 * fairs): the group has to pay and confirm online. Others can pay on reach.
 */
export function needsPrepay(place: Place) {
  return !!place.hourly || place.category === "Arcade" || place.category === "Fair";
}

/** Cancelling a booking costs 10% of what was paid; the rest is refunded. */
export const CANCELLATION_FEE_RATE = 0.1;

export function cancellation(amountPaid: number) {
  const fee = Math.round(amountPaid * CANCELLATION_FEE_RATE);
  return { fee, refund: Math.max(0, amountPaid - fee) };
}
