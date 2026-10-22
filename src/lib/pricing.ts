import { CONVENIENCE_FEE } from "@/lib/api/payments";
import type { Place } from "@/lib/types";

export function quote(place: Place, people: number) {
  const subtotal = place.pricePerPerson * people;
  const total = subtotal + CONVENIENCE_FEE;
  return { subtotal, fee: CONVENIENCE_FEE, total, perPerson: Math.ceil(total / Math.max(people, 1)) };
}
