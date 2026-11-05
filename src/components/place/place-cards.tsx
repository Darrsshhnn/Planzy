import { Check, Clock, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { AiIcon } from "@/components/brand/ai-icon";
import { ButtonLink } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar";
import { RatingBadge, RatingInline, RatingPill } from "@/components/ui/rating";
import { rupees } from "@/lib/format";
import { formatTimeShort } from "@/lib/time";
import type { Place, RecentOuting } from "@/lib/types";
import { FavouriteButton } from "./favourite-button";
import { AvailabilityChip, LivePill } from "./live-status";
import { PlaceImage } from "./place-image";

/**
 * One status chip per card, to keep cards calm: the hourly rate for sports
 * booked by the hour, otherwise today's availability.
 */
function StatusChip({ place }: { place: Place }) {
  return place.hourly ? <HourlyRate place={place} /> : <AvailabilityChip place={place} />;
}

/** "92% match · Sports": how well a place fits your interests. */
function MatchPill({ match, note, dark }: { match: number; note?: string; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${dark ? "bg-ink text-brand" : "bg-cream text-ink"}`}
    >
      <AiIcon size={12} className="text-brand" /> {match}% match{note ? ` · ${note}` : ""}
    </span>
  );
}

/**
 * Large dark card on Home > Recommended for you. With `match`/`reason` it
 * says why the place was picked for you (from your interests).
 */
export function FeaturedPlaceCard({
  place,
  priority,
  match,
  reason,
}: {
  place: Place;
  priority?: boolean;
  match?: number;
  reason?: string;
}) {
  return (
    <article className="reveal card-dark relative overflow-hidden">
      <Link href={`/place/${place.id}`} aria-label={place.name} className="block">
        <PlaceImage place={place} className="h-[200px] w-full" priority={priority} />
        <div className="pointer-events-none absolute inset-x-0 top-[110px] h-[90px] bg-gradient-to-b from-transparent to-ink" />
      </Link>
      <LivePill place={place} className="pointer-events-none absolute left-4 top-4" />
      <FavouriteButton placeId={place.id} className="absolute right-4 top-4" />
      <div className="relative -mt-8 px-5 pb-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-[21px] font-bold leading-tight">{place.name}</h3>
          <RatingInline value={place.rating} />
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-white/85">
          <span className="inline-flex items-center gap-1">
            {place.distanceKm} km · {place.area} <Navigation size={13} />
          </span>
          <span aria-hidden className="text-white/35">
            |
          </span>
          <span>
            Open {formatTimeShort(place.open)} – {formatTimeShort(place.close)}
          </span>
        </p>
        {match !== undefined && (
          <div className="mt-3 flex flex-col gap-1.5">
            <MatchPill match={match} note={place.category} />
            {reason && <p className="text-[12px] leading-[17px] text-white/70">{reason}</p>}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <StatusChip place={place} />
          <div className="flex shrink-0 gap-2.5">
            <MapLink place={place} className="h-[44px] w-[44px]" />
            <ButtonLink href={`/place/${place.id}`} variant="brand" size="md" className="w-[96px]">
              Visit
            </ButtonLink>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Recents card (Figma layout): photo on top, group, rating, members and place below. Sized to its content. */
export function RecentCard({ outing, place, href }: { outing: RecentOuting; place: Place; href?: string }) {
  return (
    <Link
      href={href ?? `/history/old-${outing.id}`}
      aria-label={`${outing.groupName}, ${place.name}`}
      className="reveal-x card-dark flex w-[160px] shrink-0 flex-col overflow-hidden"
    >
      <PlaceImage place={place} className="h-[88px] w-full shrink-0" sizes="160px" />
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2.5 text-white">
        <div className="flex items-start justify-between gap-1.5">
          <p className="line-clamp-2 text-[12px] font-semibold leading-[15px]">{outing.groupName}</p>
          <RatingPill value={outing.rating} className="shrink-0" />
        </div>
        <AvatarStack ids={outing.memberIds} size={22} max={3} ring="white" />
        <div className="mt-auto min-w-0">
          <p className="truncate text-[11px] font-semibold leading-[14px]">{place.name}</p>
          <p className="truncate text-[10px] leading-[13px] text-white/70">{place.area}, Ahmedabad</p>
        </div>
      </div>
    </Link>
  );
}

/** Dark card in the Home "Nearby Places" carousel. */
export function NearbyCard({ place, match, note }: { place: Place; match?: number; note?: string }) {
  return (
    <div className="reveal-x relative w-[240px] shrink-0">
      <Link href={`/place/${place.id}`} className="card-dark flex h-full flex-col overflow-hidden">
        <div className="relative">
          <PlaceImage place={place} className="h-[110px] w-full" sizes="250px" />
          <LivePill place={place} className="absolute left-2 top-2" />
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3.5 pb-3.5 pt-3 text-white">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold leading-[16px]">{place.name}</p>
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-white/85">
              {place.distanceKm} km <Navigation size={11} />
            </span>
          </div>
          {match !== undefined && <MatchPill match={match} note={note} />}
          <span className="mt-auto pt-1">
            <StatusChip place={place} />
          </span>
        </div>
      </Link>
      <MapLink place={place} className="absolute right-2.5 top-[74px] h-8 w-8 shadow-[0_2px_0_#242a2f]" />
    </div>
  );
}

/** "₹1,200/hr · per turf" for sports booked by the hour; nothing otherwise. */
export function HourlyRate({ place, className = "" }: { place: Place; className?: string }) {
  if (!place.hourly) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white ${className}`}
    >
      <Clock size={10} />
      {rupees(place.hourly.rate)}/hr · per {place.hourly.unit}
    </span>
  );
}

/** Opens the in-app map centred on this place. */
export function MapLink({ place, className = "" }: { place: Place; className?: string }) {
  return (
    <Link
      href={`/map?place=${place.id}`}
      aria-label={`${place.name} on the map`}
      className={`pointer-events-auto flex items-center justify-center rounded-full border border-cream/60 bg-cream text-brand ${className}`}
    >
      <MapPin size={16} />
    </Link>
  );
}

/** Horizontal row card used on Recommendation, Planzy AI and the popular-place picker. */
export function PlaceRowCard({
  place,
  selected,
  onSelect,
  note,
  match,
  km,
}: {
  place: Place;
  selected?: boolean;
  onSelect?: () => void;
  note?: string;
  /** Preference-match percentage, shown on Recommendation. */
  match?: number;
  /** Distance from the person (defaults to the place's listed distance). */
  km?: number;
}) {
  return (
    <div
      className={[
        "reveal card relative flex gap-3.5 p-3 transition",
        selected ? "border-brand! ring-2 ring-brand/70" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${selected ? "Remove" : "Add"} ${place.name}`}
        className="absolute inset-0 z-0 rounded-[14px]"
      />
      <div className="pointer-events-none relative h-[124px] w-[124px] shrink-0 overflow-hidden rounded-[10px]">
        <PlaceImage place={place} className="h-full w-full" sizes="130px" />
        <RatingBadge value={place.rating} className="absolute bottom-2 right-2" />
      </div>
      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="font-heading text-[17px] font-bold leading-tight">{place.name}</h3>
        <p className="mt-1 text-[12px] leading-[16px] text-ink/70">
          {km ?? place.distanceKm} km · {place.area}
        </p>
        {match !== undefined && (
          <span className="mt-2 flex">
            <MatchPill match={match} dark />
          </span>
        )}
        {note && <p className="mt-1 text-[11px] text-brand">{note}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <StatusChip place={place} />
          <Link
            href={`/place/${place.id}`}
            className="pointer-events-auto shrink-0 text-[12px] font-medium text-navy underline underline-offset-2"
          >
            Details
          </Link>
        </div>
      </div>
      {selected && (
        <span className="pointer-events-none absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand text-white">
          <Check size={14} />
        </span>
      )}
    </div>
  );
}
