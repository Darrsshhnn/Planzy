"use client";

import { CalendarCheck, Loader2, MapPin, MessageSquareText, Minus, Plus, ShieldCheck, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PriceSummary } from "@/components/booking/price-summary";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { StickyFooter } from "@/components/layout/sticky-footer";
import { PlaceImage } from "@/components/place/place-image";
import { VenueChatSheet } from "@/components/place/venue-chat-sheet";
import { RoleSwitch } from "@/components/plan/role-switch";
import { Button, ButtonLink } from "@/components/ui/button";
import { FieldBox, PlanCard } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingBadge } from "@/components/ui/rating";
import { getPerson, getPlace } from "@/lib/api/data";
import { formatDateLong, hash, rupees } from "@/lib/format";
import { quote } from "@/lib/pricing";
import { bookingSlots } from "@/lib/time";
import { planActions, usePlan } from "@/store/plan-store";
import { useViewer } from "@/store/viewer-store";

export default function ContactBookingPage() {
  const router = useRouter();
  const plan = usePlan();
  const { isAdmin } = useViewer();
  const [messaging, setMessaging] = useState(false);
  const place = getPlace(plan.chosenPlaceId);

  if (!plan.locked || !place) {
    return (
      <Screen>
        <PageHeader title="Contact & Booking" backHref="/decision" />
        <EmptyState
          icon={CalendarCheck}
          title="No place locked yet"
          body="The admin locks the final place on the Final Decision screen, then books it here."
          action={
            <ButtonLink href={plan.id ? `/chat/${plan.id}` : "/chat"} block>
              Back to Group Chat
            </ButtonLink>
          }
        />
      </Screen>
    );
  }

  if (plan.booking.status === "walk-in") {
    return (
      <Screen>
        <PageHeader title="Contact & Booking" backHref="/decision" />
        <EmptyState
          icon={Utensils}
          title="No booking needed"
          body={`${place.name} is a food place: no pre-payment or booking for now. Just walk in with your group.`}
          action={
            <ButtonLink href="/locked" block>
              View plan
            </ButtonLink>
          }
        />
      </Screen>
    );
  }

  const { booking } = plan;
  const hours = booking.hours ?? 1;
  const admin = getPerson(plan.adminId);
  const confirmed = booking.status !== "none";
  const slots = bookingSlots(plan.timeSlot);
  const isFull = (slot: string) => hash(place.id + plan.date + slot) % 4 === 0;

  return (
    <Screen
      withFooter
      overlay={
        <>
          <StickyFooter>
        {confirmed ? (
          <ButtonLink href="/locked" block>
            View booking
          </ButtonLink>
        ) : isAdmin ? (
          <>
            <Button block disabled={!booking.slot} onClick={() => router.push("/booking/review")}>
              Review booking · {rupees(quote(place, booking.people, hours).total)}
            </Button>
            {!booking.slot && <p className="mt-2 text-center text-[12px] text-muted">Pick an available time slot</p>}
          </>
        ) : (
          <div className="card flex items-center gap-3 bg-cream! p-4" role="status">
            <Loader2 size={26} className="shrink-0 animate-spin text-brand" />
            <div>
              <p className="text-[14px] font-semibold">Waiting for {admin.name} to book</p>
              <p className="text-[12px] text-ink/80">
                Only the group admin can book. Your share will be about{" "}
                {rupees(quote(place, booking.people, hours).perPerson)}. This updates as soon as it&apos;s booked.
              </p>
            </div>
          </div>
        )}
</StickyFooter>
          <VenueChatSheet place={place} open={messaging} onClose={() => setMessaging(false)} />
        </>
      }
    >
      <PageHeader title="Contact & Booking" backHref="/decision" subtitle={plan.groupName} />
      <RoleSwitch />

      <PlanCard className="mt-3">
        <div className="flex gap-3">
          <div className="relative h-[86px] w-[100px] shrink-0 overflow-hidden rounded-[8px]">
            <PlaceImage place={place} className="h-full w-full" sizes="100px" />
            <RatingBadge value={place.rating} className="absolute bottom-1.5 right-1.5 !text-[10px]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-[18px] font-bold leading-tight">{place.name}</h2>
            <p className="mt-1 text-[12px] leading-[16px]">{place.address}</p>
            <p className="mt-1 text-[12px] text-muted">{formatDateLong(plan.date)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMessaging(true)}
            className="card flex h-[48px] items-center justify-center gap-2 text-[13px] font-medium"
          >
            <MessageSquareText size={20} className="text-brand" /> Message
          </button>
          <Link href={`/map?place=${place.id}`} className="card flex h-[48px] items-center justify-center gap-2 text-[13px] font-medium">
            <MapPin size={20} className="text-brand" /> Location
          </Link>
        </div>

        <h3 className="mt-5 font-heading text-[17px] font-bold">Availability</h3>
        <p className="text-[11px] text-muted">
          {plan.timeSlot} slots · Right now: {place.live.crowd.toLowerCase()} (updated {place.live.updatedMinsAgo} min ago)
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {slots.map((slot) => {
            const full = isFull(slot);
            return (
              <Chip
                key={slot}
                selected={booking.slot === slot}
                disabled={full || !isAdmin || confirmed}
                onClick={() => planActions.setBooking({ slot })}
                className={full ? "!border-ink/20 !text-ink/35 line-through" : ""}
              >
                {slot}
              </Chip>
            );
          })}
        </div>

        <h3 className="mt-5 font-heading text-[17px] font-bold">People</h3>
        <FieldBox className="mt-2 flex items-center justify-between px-3 py-2">
          <span className="text-[13px]">{plan.memberIds.length} in the group</span>
          <div className="flex items-center gap-3">
            <button
              aria-label="Fewer people"
              disabled={!isAdmin || confirmed || booking.people <= 1}
              onClick={() => planActions.setBooking({ people: booking.people - 1 })}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ink disabled:opacity-30"
            >
              <Minus size={16} />
            </button>
            <span className="w-5 text-center text-[16px] font-semibold">{booking.people}</span>
            <button
              aria-label="More people"
              disabled={!isAdmin || confirmed || booking.people >= 20}
              onClick={() => planActions.setBooking({ people: booking.people + 1 })}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ink disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
        </FieldBox>

        {place.hourly && (
          <>
            <h3 className="mt-5 font-heading text-[17px] font-bold">Hours</h3>
            <FieldBox className="mt-2 flex items-center justify-between px-3 py-2">
              <span className="text-[13px]">
                {rupees(place.hourly.rate)} per {place.hourly.unit} / hour
              </span>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Fewer hours"
                  disabled={!isAdmin || confirmed || hours <= 1}
                  onClick={() => planActions.setBooking({ hours: hours - 1 })}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="w-5 text-center text-[16px] font-semibold">{hours}</span>
                <button
                  aria-label="More hours"
                  disabled={!isAdmin || confirmed || hours >= 4}
                  onClick={() => planActions.setBooking({ hours: hours + 1 })}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink disabled:opacity-30"
                >
                  <Plus size={16} />
                </button>
              </div>
            </FieldBox>
          </>
        )}

        <div className="mt-5 rounded-[10px] bg-paper p-3.5">
          <PriceSummary place={place} people={booking.people} hours={hours} paid={booking.status === "paid"} />
        </div>
        <p className="mt-3 flex items-start gap-2 text-[11px] leading-[15px] text-ink/80">
          <ShieldCheck size={16} className="mt-px shrink-0 text-brand" />
          The group admin books for everyone: pay online now, or pay on reaching the venue by cash or UPI. Members
          settle their share with the admin.
        </p>
      </PlanCard>

    </Screen>
  );
}
