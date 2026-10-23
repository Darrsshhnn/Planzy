import { BellRing, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceImage } from "@/components/place/place-image";
import { Avatar } from "@/components/ui/avatar";
import { RatingBadge } from "@/components/ui/rating";
import { getPerson, getPlace } from "@/lib/api/data";
import { formatClock, priceLabel } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

export function MessageBubble({ message, viewerId }: { message: ChatMessage; viewerId: string }) {
  if (message.kind === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="max-w-[85%] rounded-full bg-cream px-3 py-1 text-center text-[11px] text-ink/80">
          {message.text}
        </span>
      </div>
    );
  }

  if (message.kind === "alert") {
    return (
      <div className="card flex items-start gap-2.5 border-brand! bg-cream! px-3 py-2.5" role="alert">
        <BellRing size={18} className="mt-0.5 shrink-0 text-brand" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Group notification</p>
          <p className="text-[13px] leading-[18px]">{message.text}</p>
        </div>
      </div>
    );
  }

  const mine = message.authorId === viewerId;
  const author = getPerson(message.authorId);

  return (
    <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      {!mine && <Avatar personId={message.authorId} size={28} />}
      <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        {!mine && <span className="mb-0.5 ml-1 text-[11px] font-medium text-muted">{author.name}</span>}
        {message.kind === "text" ? (
          <p
            className={[
              "rounded-[16px] px-3.5 py-2 text-[14px] leading-[20px]",
              mine ? "rounded-br-[4px] bg-brand text-white" : "rounded-bl-[4px] bg-ink text-white",
            ].join(" ")}
          >
            {message.text}
          </p>
        ) : message.kind === "image" ? (
          <div className="card-dark relative h-[180px] w-[220px] overflow-hidden">
            <Image
              src={message.src}
              alt="Shared photo"
              fill
              sizes="220px"
              unoptimized={message.src.startsWith("data:")}
              className="object-cover"
            />
          </div>
        ) : message.kind === "location" ? (
          <LocationMessage label={message.label} lat={message.lat} lng={message.lng} />
        ) : (
          <PlaceMessage placeId={message.placeId} />
        )}
        <span className="mx-1 mt-0.5 text-[10px] text-muted">{formatClock(message.at)}</span>
      </div>
    </div>
  );
}

function LocationMessage({ label, lat, lng }: { label: string; lat?: number; lng?: number }) {
  const query = lat !== undefined && lng !== undefined ? `${lat},${lng}` : label;
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
      target="_blank"
      rel="noreferrer"
      className="card-dark block w-[220px] overflow-hidden text-white"
    >
      <div className="relative flex h-[90px] items-center justify-center bg-[radial-gradient(circle_at_30%_40%,#2f5b80,transparent_55%),radial-gradient(circle_at_75%_70%,#3d6b4f,transparent_50%)] bg-navy">
        <span className="absolute inset-0 bg-[linear-gradient(#ffffff14_1px,transparent_1px),linear-gradient(90deg,#ffffff14_1px,transparent_1px)] bg-[size:22px_22px]" />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand ring-4 ring-brand/30">
          <MapPin size={20} />
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="text-[13px] font-semibold">Shared location</p>
        <p className="truncate text-[11px] text-white/80">{label}</p>
        <p className="mt-1 text-[11px] font-semibold text-brand">Open in Maps</p>
      </div>
    </a>
  );
}

function PlaceMessage({ placeId }: { placeId: string }) {
  const place = getPlace(placeId);
  if (!place) return null;
  return (
    <Link
      href={`/place/${place.id}`}
      className={`block w-[220px] overflow-hidden card-dark text-white`}
    >
      <div className="relative">
        <PlaceImage place={place} className="h-[96px] w-full" sizes="220px" />
        <RatingBadge value={place.rating} className="absolute bottom-2 right-2" />
        <span className="absolute left-2 top-2 rounded-full bg-cream px-2 text-[10px] font-semibold leading-[18px] text-ink">
          Added to shortlist
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="font-heading text-[15px] font-bold">{place.name}</p>
        <p className="text-[11px] text-white/80">
          {place.distanceKm} km · {place.area} · {priceLabel(place)}
        </p>
      </div>
    </Link>
  );
}
