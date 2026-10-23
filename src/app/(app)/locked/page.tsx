"use client";

import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  MessageSquare,
  Navigation,
  Receipt,
  Share2,
  Store,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PriceSummary } from "@/components/booking/price-summary";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceImage } from "@/components/place/place-image";
import { AvatarStack } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingBadge } from "@/components/ui/rating";
import { getPlace } from "@/lib/api/data";
import { formatDateLong, rupees } from "@/lib/format";
import { quote } from "@/lib/pricing";
import { planActions, usePlan } from "@/store/plan-store";

export default function LockedInPage() {
  const plan = usePlan();
  const [shared, setShared] = useState("");
  const [showPrice, setShowPrice] = useState(false);
  const place = getPlace(plan.chosenPlaceId);
  const { booking } = plan;

  if (!place || booking.status === "none") {
    return (
      <Screen>
        <PageHeader title="Locked In" backHref="/" />
        <EmptyState
          icon={CalendarClock}
          title="Not booked yet"
          body="Once the admin pays for the group, the confirmed plan shows up here."
          action={
            <ButtonLink href={plan.locked ? "/booking" : plan.id ? `/chat/${plan.id}` : "/chat"} block>
              {plan.locked ? "See booking status" : "Back to Group Chat"}
            </ButtonLink>
          }
        />
      </Screen>
    );
  }

  const walkIn = booking.status === "walk-in";
  const atVenue = booking.status === "pay-at-venue";
  const when = walkIn ? `${plan.timeSlot.toLowerCase()}` : `at ${booking.slot}`;
  const details = `${plan.groupName}: ${place.name}, ${formatDateLong(plan.date)} ${when}. ${place.address}.${
    walkIn ? " Walk-in, no booking needed." : ` Booking ref ${booking.reference}.`
  }`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Planzy booking", text: details });
        return;
      }
      await navigator.clipboard.writeText(details);
      setShared("Details copied");
    } catch {
      setShared("Couldn't share right now");
    }
    setTimeout(() => setShared(""), 2200);
  };

  const hours = booking.hours ?? 1;
  const payLine = walkIn
    ? `Walk-in · pay for what you order (~${rupees(place.pricePerPerson)}/person)`
    : atVenue
      ? `Pay ${rupees(booking.amount)} at the venue by ${booking.method === "cash" ? "cash" : "UPI"}`
      : `${rupees(booking.amount || quote(place, booking.people, hours).total)} paid via ${booking.method.toUpperCase()}`;
  const tiles = [
    { icon: CalendarDays, top: formatDateLong(plan.date).split(",")[0], bottom: formatDateLong(plan.date).replace(/^[^,]+, /, "").replace(/,? \d{4}$/, "") },
    { icon: Clock, top: walkIn ? plan.timeSlot : booking.slot, bottom: place.hourly ? `${hours} hour${hours === 1 ? "" : "s"}` : walkIn ? "Any time" : "Arrive by" },
  ];

  return (
    <Screen>
      <PageHeader title="Locked In" backHref="/" />

      <div className="flex items-center gap-3 pb-4">
        <span className="animate-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white ring-4 ring-cream">
          <Check size={26} />
        </span>
        <div>
          <h2 className="font-heading text-[20px] font-bold leading-tight">You&apos;re all set!</h2>
          <p className="text-[12px] text-muted">{plan.groupName}</p>
        </div>
      </div>

      {/* Ticket */}
      <Link href={`/place/${place.id}`} className="reveal card-dark block overflow-hidden text-white">
        <div className="relative h-[170px]">
          <PlaceImage place={place} className="h-full w-full" sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-semibold text-ink">
            {walkIn ? "Walk-in" : atVenue ? "Pay at venue" : "Booked"}
          </span>
          <RatingBadge value={place.rating} className="absolute right-3 top-3" />
          <div className="absolute inset-x-4 bottom-3">
            <h3 className="font-heading text-[22px] font-bold leading-tight">{place.name}</h3>
            <p className="text-[12px] text-white/80">
              {place.area} · {place.category}
            </p>
          </div>
        </div>
      </Link>

      {/* Key facts */}
      <div className="reveal mt-3 grid grid-cols-3 gap-2">
        {tiles.map(({ icon: Icon, top, bottom }) => (
          <div key={top} className="card flex flex-col items-center px-1 py-3 text-center">
            <Icon size={18} className="text-brand" />
            <span className="mt-1 text-[14px] font-bold leading-tight">{top}</span>
            <span className="text-[11px] text-muted">{bottom}</span>
          </div>
        ))}
        <div className="card flex flex-col items-center px-1 py-3 text-center">
          <AvatarStack ids={plan.memberIds} size={24} max={3} />
          <span className="mt-1 text-[14px] font-bold leading-tight">{plan.memberIds.length}</span>
          <span className="text-[11px] text-muted">going</span>
        </div>
      </div>

      {/* Payment: one line, details on demand */}
      <div className="reveal card mt-3 p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-brand">
            {walkIn ? <Utensils size={17} /> : atVenue ? <Store size={17} /> : <Receipt size={17} />}
          </span>
          <p className="min-w-0 flex-1 text-[13px] font-medium">{payLine}</p>
          {!walkIn && (
            <button
              onClick={() => setShowPrice((v) => !v)}
              aria-expanded={showPrice}
              className="flex items-center gap-0.5 text-[12px] font-semibold text-navy"
            >
              Details <ChevronDown size={14} className={`transition-transform ${showPrice ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
        {showPrice && !walkIn && (
          <div className="mt-3 border-t border-dashed border-ink/20 pt-3">
            <PriceSummary place={place} people={booking.people} hours={hours} paid={!atVenue} atVenue={atVenue} />
          </div>
        )}
        {!walkIn && <p className="mt-2 font-mono text-[11px] text-muted">Ref {booking.reference}</p>}
      </div>

      {/* Actions */}
      <div className="reveal mt-4 grid grid-cols-3 gap-2">
        {[
          { icon: Navigation, label: "Directions", href: `/map?place=${place.id}` },
          { icon: Share2, label: shared || "Share", onClick: share },
          { icon: MessageSquare, label: "Group chat", href: `/chat/${plan.id}` },
        ].map(({ icon: Icon, label, href, onClick }) => {
          const inner = (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-cream">
                <Icon size={19} />
              </span>
              <span className="text-[12px] font-semibold">{label}</span>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="flex flex-col items-center gap-1.5 py-1">
              {inner}
            </Link>
          ) : (
            <button key={label} onClick={onClick} className="flex flex-col items-center gap-1.5 py-1">
              {inner}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <ButtonLink href="/plan/friends" block onClick={() => planActions.start("new")}>
          Plan another outing
        </ButtonLink>
      </div>
    </Screen>
  );
}
