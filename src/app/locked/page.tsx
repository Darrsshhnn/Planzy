"use client";

import { CalendarClock, Check, Navigation, PartyPopper, Receipt, Share2, Store, Utensils } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PriceSummary } from "@/components/booking/price-summary";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceImage } from "@/components/place/place-image";
import { AvatarStack } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { PlanCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingBadge } from "@/components/ui/rating";
import { getPerson, getPlace } from "@/lib/api/data";
import { formatDateLong, mapsUrl, rupees } from "@/lib/format";
import { planActions, usePlan } from "@/store/plan-store";

export default function LockedInPage() {
  const plan = usePlan();
  const [shared, setShared] = useState("");
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

  return (
    <Screen>
      <PageHeader title="Locked In" backHref="/" />

      <div className="flex flex-col items-center pb-5 pt-1 text-center">
        <span className="animate-pop flex h-[76px] w-[76px] items-center justify-center rounded-full bg-brand text-white ring-8 ring-cream">
          <Check size={40} />
        </span>
        <h2 className="mt-4 flex items-center gap-2 font-heading text-[24px] font-bold">
          You&apos;re all set! <PartyPopper size={24} className="text-brand" />
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          {walkIn ? "Walk-in plan · no booking needed" : `Booking ref ${booking.reference}`}
        </p>
      </div>

      <PlanCard>
        <Link href={`/place/${place.id}`} className="flex gap-3">
          <div className="relative h-[80px] w-[96px] shrink-0 overflow-hidden rounded-[8px]">
            <PlaceImage place={place} className="h-full w-full" sizes="96px" />
            <RatingBadge value={place.rating} className="absolute bottom-1.5 right-1.5 !text-[10px]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-[18px] font-bold leading-tight">{place.name}</h3>
            <p className="mt-1 text-[12px] leading-[16px]">{place.address}</p>
            <span className="mt-1 inline-block text-[11px] font-medium text-navy underline underline-offset-2">
              Place details
            </span>
          </div>
        </Link>

        <div className="mt-4 flex items-center gap-3 rounded-[10px] bg-paper p-3">
          <CalendarClock size={22} className="shrink-0 text-brand" />
          <div className="text-[13px]">
            <p className="font-semibold">{formatDateLong(plan.date)}</p>
            <p className="text-muted">
              {walkIn ? `${plan.timeSlot} · walk in any time it's open` : `Arrive by ${booking.slot}`}
            </p>
          </div>
        </div>

        {walkIn ? (
          <div className="mt-3 flex items-start gap-3 rounded-[10px] bg-paper p-3">
            <Utensils size={20} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[13px]">
              Food places don&apos;t need pre-payment or booking. Pay for what you order, about{" "}
              {rupees(place.pricePerPerson)} per person.
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-[10px] bg-paper p-3">
            <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <Receipt size={18} className="text-brand" /> Price details
            </p>
            <PriceSummary place={place} people={booking.people} paid={!atVenue} atVenue={atVenue} />
            {atVenue ? (
              <p className="mt-2 flex items-center gap-1.5 rounded-[8px] bg-cream px-2.5 py-2 text-[12px] font-medium">
                <Store size={15} className="shrink-0 text-brand" />
                Pay {rupees(booking.amount)} on reaching the venue by {booking.method === "cash" ? "cash" : "UPI"}
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-muted">
                Paid by {getPerson(plan.adminId).name} via {booking.method.toUpperCase()}
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-[12px]">
          <AvatarStack ids={plan.memberIds} size={28} max={6} />
          <span className="text-muted">{plan.memberIds.length} going</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <a
            href={mapsUrl(place.name, place.address)}
            target="_blank"
            rel="noreferrer"
            className="flex h-[44px] items-center justify-center gap-2 card text-[14px] font-semibold"
          >
            <Navigation size={18} /> Direction
          </a>
          <button
            onClick={share}
            className="flex h-[44px] items-center justify-center gap-2 card text-[14px] font-semibold"
          >
            <Share2 size={18} /> {shared || "Share details"}
          </button>
        </div>
      </PlanCard>

      <div className="mt-5 space-y-3 px-1.5">
        <ButtonLink href={`/chat/${plan.id}`} block>
          Open Group Chat
        </ButtonLink>
        <ButtonLink
          href="/plan/new"
          variant="ghost"
          size="md"
          block
          onClick={() => planActions.reset()}
        >
          Plan another outing
        </ButtonLink>
      </div>
    </Screen>
  );
}
