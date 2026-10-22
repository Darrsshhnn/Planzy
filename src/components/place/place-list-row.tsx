import Link from "next/link";
import type { ReactNode } from "react";
import { rupees } from "@/lib/format";
import type { Place } from "@/lib/types";
import { AvailabilityChip, LivePill } from "./live-status";
import { PlaceImage } from "./place-image";

/** Compact list row: thumbnail, name, key facts and an optional trailing action. */
export function PlaceListRow({ place, trailing }: { place: Place; trailing?: ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Link href={`/place/${place.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative h-[72px] w-[80px] shrink-0 overflow-hidden rounded-[8px]">
          <PlaceImage place={place} className="h-full w-full" sizes="80px" />
          <LivePill place={place} className="absolute bottom-1 left-1 !px-1.5 !text-[8px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">{place.name}</p>
          <p className="truncate text-[11px] text-muted">
            {place.category} · {place.distanceKm} km · {place.area}
          </p>
          <p className="text-[11px] text-muted">
            {rupees(place.pricePerPerson)}/person · Rated {place.rating.toFixed(1)}
          </p>
          <AvailabilityChip place={place} className="mt-1" />
        </div>
      </Link>
      {trailing}
    </li>
  );
}
