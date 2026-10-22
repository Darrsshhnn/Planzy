"use client";

import Link from "next/link";
import { PlaceImage } from "@/components/place/place-image";
import { RatingBadge } from "@/components/ui/rating";
import { rupees } from "@/lib/format";
import type { Place, Vote } from "@/lib/types";
import type { Tally } from "@/lib/votes";
import { TallyBar, VoteButtons } from "./vote-controls";

export function ShortlistCard({
  place,
  tally,
  total,
  myVote,
  onVote,
  locked,
  leading,
  className = "w-[262px]",
}: {
  place: Place;
  tally: Tally;
  total: number;
  myVote?: Vote;
  onVote: (v: Vote) => void;
  locked: boolean;
  leading: boolean;
  className?: string;
}) {
  return (
    <article
      className={`card shrink-0 p-2.5 ${leading ? "border-brand!" : ""} ${className}`}
    >
      <Link href={`/place/${place.id}`} className="flex gap-2.5">
        <div className="relative h-[62px] w-[74px] shrink-0 overflow-hidden rounded-[8px]">
          <PlaceImage place={place} className="h-full w-full" sizes="80px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h3 className="truncate font-heading text-[15px] font-bold">{place.name}</h3>
            {leading && (
              <span className="shrink-0 rounded-full bg-brand px-1.5 text-[9px] font-semibold uppercase leading-[16px] text-white">
                Top
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-muted">
            {place.distanceKm} km · {place.area} · {rupees(place.pricePerPerson)}/person
          </p>
          <RatingBadge value={place.rating} className="mt-1 !text-[10px]" />
        </div>
      </Link>
      <div className="mt-2.5">
        <TallyBar tally={tally} total={total} />
      </div>
      <div className="mt-2">
        <VoteButtons value={myVote} onVote={onVote} disabled={locked} />
      </div>
    </article>
  );
}
