import { Check, Images, MapPin, Navigation, Sparkles } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar";
import { RatingBadge, RatingInline, RatingPill } from "@/components/ui/rating";
import { formatTimeShort } from "@/lib/time";
import type { Place, RecentOuting } from "@/lib/types";
import { FavouriteButton } from "./favourite-button";
import { AvailabilityChip, LivePill } from "./live-status";
import { PlaceImage } from "./place-image";

/** "+3 photos" corner tag: the card opens a gallery and visitor photos. */
function PhotoCount({ place, className = "" }: { place: Place; className?: string }) {
  const total = place.gallery.length + (place.image ? 1 : 0);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur ${className}`}
    >
      <Images size={11} /> {total}
    </span>
  );
}

/** Large dark card from Home > Recommendation. */
export function FeaturedPlaceCard({ place, priority }: { place: Place; priority?: boolean }) {
  return (
    <article className="reveal card-dark relative overflow-hidden">
      <div>
        <Link href={`/place/${place.id}`} aria-label={place.name} className="block">
          <PlaceImage place={place} className="h-[220px] w-full" priority={priority} />
          <div className="pointer-events-none absolute inset-x-0 top-[120px] h-[100px] bg-gradient-to-b from-transparent to-ink" />
        </Link>
        <div className="pointer-events-none absolute left-4 top-4 flex gap-1.5">
          <LivePill place={place} />
          <PhotoCount place={place} />
        </div>
        <FavouriteButton placeId={place.id} className="absolute right-4 top-4" />
        <div className="relative -mt-10 px-4 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-[21px] font-bold text-white">{place.name}</h3>
            <RatingInline value={place.rating} />
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap text-[13px] text-white">
            {place.distanceKm} km, {place.area}, Ahmedabad
            <Navigation size={13} />
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="min-w-0 text-white">
              <p className="text-[10px] leading-[15px] text-white/90">{place.hours.weekday}</p>
              <p className="text-[10px] leading-[15px] text-white/90">
                {place.closedOn ? (
                  <>
                    {place.hours.weekend.split(",")[0]}, <span className="text-brand">Closed</span>
                  </>
                ) : (
                  place.hours.weekend
                )}
              </p>
              <AvailabilityChip place={place} className="mt-1.5" />
            </div>
            <div className="flex shrink-0 gap-2">
              <MapLink place={place} className="h-[44px] w-[44px]" />
              <ButtonLink href={`/place/${place.id}`} variant="brand" size="md" className="w-[96px]">
                Visit
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Recents card (Figma layout): photo on top, group, rating, members and area below. 135x160. */
export function RecentCard({ outing, place }: { outing: RecentOuting; place: Place }) {
  return (
    <Link
      href={`/history/old-${outing.id}`}
      aria-label={`${outing.groupName}, ${place.name}`}
      className="reveal-x card-dark flex h-[160px] w-[135px] shrink-0 flex-col overflow-hidden"
    >
      <PlaceImage place={place} className="h-[72px] w-full shrink-0" sizes="140px" />
      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-1.5 text-white">
        <div className="flex items-start justify-between gap-1">
          <p className="line-clamp-2 text-[11px] font-semibold leading-[14px]">{outing.groupName}</p>
          <RatingPill value={outing.rating} className="shrink-0" />
        </div>
        <div className="mt-1">
          <AvatarStack ids={outing.memberIds} size={22} max={3} ring="white" />
        </div>
        <p className="mt-auto line-clamp-2 text-[9px] leading-[11px] text-white/85">
          {place.name}, {place.area}, Ahmedabad
        </p>
      </div>
    </Link>
  );
}

/** Dark card in the Home "Nearby Places" carousel. */
export function NearbyCard({ place }: { place: Place }) {
  return (
    <div className="reveal-x relative w-[248px] shrink-0">
    <Link
      href={`/place/${place.id}`}
      className="card-dark block overflow-hidden"
    >
      <div className="relative">
        <PlaceImage place={place} className="h-[96px] w-full" sizes="250px" />
        <LivePill place={place} className="absolute left-1.5 top-1.5" />
        <PhotoCount place={place} className="absolute right-1.5 top-1.5" />
      </div>
      <div className="px-2 pb-2 pt-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-semibold leading-[15px]">{place.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-[12px]">
            {place.distanceKm} km <Navigation size={12} />
          </span>
        </div>
        <p className="mt-1.5 line-clamp-1 text-[9px] leading-[11px] text-white/85">{place.address}</p>
        <AvailabilityChip place={place} className="mt-1.5" />
      </div>
    </Link>
    <MapLink place={place} className="absolute right-2.5 top-[62px] h-8 w-8 shadow-[0_2px_0_#242a2f]" />
    </div>
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

/** Horizontal row card used on Recommendation and the popular-place picker. */
export function PlaceRowCard({
  place,
  selected,
  onSelect,
  note,
  match,
}: {
  place: Place;
  selected?: boolean;
  onSelect?: () => void;
  note?: string;
  /** Preference-match percentage, shown on Recommendation. */
  match?: number;
}) {
  return (
    <div
      className={[
        "reveal card relative flex gap-2.5 p-[9px] transition",
        selected ? "border-brand! ring-2 ring-brand/70" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${selected ? "Remove" : "Add"} ${place.name}`}
        className="absolute inset-0 z-0 rounded-[12px]"
      />
      <div className="pointer-events-none relative h-[130px] w-[150px] shrink-0 overflow-hidden rounded-[8px]">
        <PlaceImage place={place} className="h-full w-full" sizes="150px" />
        <LivePill place={place} className="absolute left-1.5 top-1.5" />
        <RatingBadge value={place.rating} className="absolute bottom-2 right-2" />
      </div>
      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="font-heading text-[17px] font-bold leading-tight">{place.name}</h3>
        {match !== undefined && (
          <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-brand">
            <Sparkles size={11} /> {match}% match
          </span>
        )}
        <p className="mt-1.5 text-[12px] leading-[16px]">
          {place.distanceKm} km, {place.area}, Ahmedabad
        </p>
        {note && <p className="mt-0.5 text-[11px] text-brand">{note}</p>}
        <p className="mt-auto text-[11px] leading-[16px]">
          Open{" "}
          <span className="text-brand">
            {formatTimeShort(place.open)} – {formatTimeShort(place.close)}
          </span>
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-1 gap-y-1">
          <AvailabilityChip place={place} />
          <span className="flex items-center gap-2">
            <Link
              href={`/map?place=${place.id}`}
              className="pointer-events-auto flex items-center gap-0.5 text-[11px] font-medium text-navy underline underline-offset-2"
            >
              <MapPin size={11} /> Map
            </Link>
            <Link
              href={`/place/${place.id}`}
              className="pointer-events-auto text-[11px] font-medium text-navy underline underline-offset-2"
            >
              Details
            </Link>
          </span>
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
