import { CONVENIENCE_FEE } from "@/lib/api/payments";
import type { Place } from "@/lib/types";

/** Price for a booking: per hour for hourly sports, otherwise per person. */
export function quote(place: Place, people: number, hours = 1) {
  const subtotal = place.hourly ? place.hourly.rate * Math.max(hours, 1) : place.pricePerPerson * people;
  const total = subtotal + CONVENIENCE_FEE;
  return { subtotal, fee: CONVENIENCE_FEE, total, perPerson: Math.ceil(total / Math.max(people, 1)) };
}
