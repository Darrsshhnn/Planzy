import { rupees } from "@/lib/format";
import { quote } from "@/lib/pricing";
import type { Place } from "@/lib/types";

export function PriceSummary({
  place,
  people,
  paid,
  atVenue,
  hours = 1,
}: {
  place: Place;
  people: number;
  hours?: number;
  paid?: boolean;
  /** Paying on reaching the venue instead of online. */
  atVenue?: boolean;
}) {
  const q = quote(place, people, hours);
  return (
    <dl className="space-y-1.5 text-[13px]">
      <div className="flex justify-between">
        <dt>
          {place.hourly
            ? `${rupees(place.hourly.rate)} × ${hours} ${hours === 1 ? "hour" : "hours"}`
            : `${rupees(place.pricePerPerson)} × ${people} ${people === 1 ? "person" : "people"}`}
        </dt>
        <dd>{rupees(q.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>Convenience fee</dt>
        <dd>{rupees(q.fee)}</dd>
      </div>
      <div className="flex justify-between border-t border-dashed border-ink/30 pt-2 text-[15px] font-semibold">
        <dt>{paid ? "Total paid" : atVenue ? "Total (pay at venue)" : "Total (pay now)"}</dt>
        <dd>{rupees(q.total)}</dd>
      </div>
      <div className="flex justify-between text-[12px] text-muted">
        <dt>Each person&apos;s share</dt>
        <dd>~{rupees(q.perPerson)}</dd>
      </div>
    </dl>
  );
}
