"use client";

import {
  Banknote,
  Building2,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  QrCode,
  Smartphone,
  Store,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PriceSummary } from "@/components/booking/price-summary";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { StickyFooter } from "@/components/layout/sticky-footer";
import { PlaceImage } from "@/components/place/place-image";
import { AvatarStack } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingBadge } from "@/components/ui/rating";
import { getPerson, getPlace } from "@/lib/api/data";
import { processPayment } from "@/lib/api/payments";
import { formatDateLong, rupees } from "@/lib/format";
import { needsPrepay, quote } from "@/lib/pricing";
import type { Booking, PaymentMethod } from "@/lib/types";
import { planActions, usePlan } from "@/store/plan-store";
import { useViewer } from "@/store/viewer-store";

interface Method {
  id: PaymentMethod;
  label: string;
  detail: string;
  icon: LucideIcon;
}

const PAY_NOW: Method[] = [
  { id: "upi", label: "UPI", detail: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Credit / Debit card", detail: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Net banking", detail: "All major banks", icon: Building2 },
];

const PAY_AT_VENUE: Method[] = [
  { id: "cash", label: "Cash", detail: "Pay at the counter on arrival", icon: Banknote },
  { id: "upi", label: "UPI at venue", detail: "Scan the venue's QR on arrival", icon: QrCode },
];

const MODES: { id: Booking["payMode"]; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "now", label: "Pay now", hint: "Instant confirmation", icon: Lock },
  { id: "venue", label: "Pay on reach", hint: "Cash or UPI", icon: Store },
];

export default function ReviewConfirmPage() {
  const router = useRouter();
  const plan = usePlan();
  const { isAdmin } = useViewer();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const place = getPlace(plan.chosenPlaceId);

  if (!plan.locked || !place || !plan.booking.slot) {
    return (
      <Screen>
        <PageHeader title="Review & Confirm" backHref="/booking" />
        <EmptyState
          icon={Lock}
          title="Nothing to confirm yet"
          body="Pick a time slot on the booking screen first."
          action={
            <ButtonLink href="/booking" block>
              Go to Booking
            </ButtonLink>
          }
        />
      </Screen>
    );
  }

  const { booking } = plan;
  const hours = booking.hours ?? 1;
  const q = quote(place, booking.people, hours);

  if (booking.status !== "none") {
    return (
      <Screen>
        <PageHeader title="Review & Confirm" backHref="/booking" />
        <EmptyState
          icon={Lock}
          title="Already booked"
          body={`${place.name} is booked for your group.`}
          action={
            <ButtonLink href="/locked" block>
              View booking
            </ButtonLink>
          }
        />
      </Screen>
    );
  }

  // Places that charge to hold the slot must be paid and confirmed now.
  const prepay = needsPrepay(place);
  const atVenue = !prepay && booking.payMode === "venue";
  const methods = atVenue ? PAY_AT_VENUE : PAY_NOW;
  // Keep the chosen method valid for the current mode.
  const method = methods.some((m) => m.id === booking.method) ? booking.method : methods[0].id;

  const setMode = (payMode: Booking["payMode"]) =>
    planActions.setBooking({ payMode, method: payMode === "venue" ? "cash" : "upi" });

  const confirm = async () => {
    if (method !== booking.method) planActions.setBooking({ method });
    if (atVenue) {
      planActions.confirmPayAtVenue(q.total);
      router.replace("/locked");
      return;
    }
    setPaying(true);
    setError("");
    try {
      const result = await processPayment({ amount: q.total, method });
      planActions.completePayment({ ...result, amount: q.total });
      router.replace("/locked");
    } catch {
      setError("Payment failed. No money was taken, please try again.");
      setPaying(false);
    }
  };

  const details = [
    { label: "Date", value: formatDateLong(plan.date).replace(/,? \d{4}$/, "") },
    { label: "Time", value: booking.slot },
    {
      label: place.hourly ? "Group · hrs" : "Group",
      value: `${booking.people}${place.hourly ? ` · ${hours}h` : booking.people === 1 ? " person" : " people"}`,
    },
  ];

  return (
    <Screen
      withFooter
      overlay={
        <>
          <StickyFooter>
        {isAdmin ? (
          <Button block onClick={confirm} disabled={paying}>
            {atVenue ? (
              <>
                <Store size={18} /> Confirm · pay {rupees(q.total)} at venue
              </>
            ) : (
              <>
                <Lock size={18} /> Pay {rupees(q.total)} &amp; Confirm
              </>
            )}
          </Button>
        ) : (
          <p className="rounded-[10px] bg-cream p-3 text-center text-[13px]">
            Only {getPerson(plan.adminId).name} (admin) can confirm for the group.
          </p>
        )}
        {error && <p className="mt-2 text-center text-[12px] text-red-600">{error}</p>}
        <p className="mt-3 text-center text-[11px] text-muted">
          You can cancel later from Locked In · 10% cancellation fee
        </p>
</StickyFooter>
          {paying && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm">
            <Loader2 size={40} className="animate-spin text-brand" />
            <p className="text-[15px] font-semibold">Processing {rupees(q.total)}…</p>
            <p className="text-[12px] text-muted">Mock payment, no real money is charged</p>
          </div>
          )}
        </>
      }
    >
      <PageHeader title="Review & Confirm" backHref="/booking" />

      {/* Booking summary: a ticket. Big photo on top, tear line, price stub below. */}
      <section className="reveal card overflow-hidden p-0!" aria-label="Booking summary">
        <div className="relative h-[240px]">
          <PlaceImage place={place} className="h-full w-full" sizes="430px" priority />
          <div className="absolute inset-x-0 bottom-0 h-[110px] bg-gradient-to-t from-ink/90 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream backdrop-blur">
            Booking ticket
          </span>
          <RatingBadge value={place.rating} className="absolute right-4 top-4" />
          <div className="absolute inset-x-4 bottom-3.5 text-white">
            <h2 className="font-heading text-[23px] font-bold leading-tight">{place.name}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-white/80">
              <MapPin size={12} /> {place.area}, Ahmedabad · {place.distanceKm} km
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-ink/10 px-2 py-4 text-center">
          {details.map(({ label, value }) => (
            <div key={label} className="min-w-0 px-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 truncate text-[14px] font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-2.5 px-5 pb-4">
          <AvatarStack ids={plan.memberIds} size={26} max={6} />
          <span className="min-w-0 truncate text-[12px] text-muted">
            {plan.groupName} · booked by {getPerson(plan.adminId).name}
          </span>
        </div>

        <div className="relative mx-0 h-0 border-t-2 border-dashed border-ink/20" aria-hidden>
          <span className="absolute -left-3.5 -top-3.5 h-7 w-7 rounded-full border border-ink bg-white" />
          <span className="absolute -right-3.5 -top-3.5 h-7 w-7 rounded-full border border-ink bg-white" />
        </div>

        <div className="bg-cream/60 px-5 pb-5 pt-5">
          <PriceSummary place={place} people={booking.people} hours={hours} atVenue={atVenue} />
        </div>
      </section>

      <h3 className="mt-8 font-heading text-[18px] font-bold">How do you want to pay?</h3>
      {prepay ? (
        <div className="card mt-3 flex items-start gap-3 border-brand! bg-cream! p-4" role="note">
          <Lock size={20} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-[13px] leading-[19px]">
            <span className="font-semibold">Pay &amp; confirm required.</span> {place.name} charges to hold your{" "}
            {place.hourly ? place.hourly.unit : "slot"}, so the booking is confirmed once it&apos;s paid.
          </p>
        </div>
      ) : (
      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="When to pay">
        {MODES.map(({ id, label, hint, icon: Icon }) => {
          const active = booking.payMode === id;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={active}
              disabled={!isAdmin}
              onClick={() => setMode(id)}
              className={`card flex items-center gap-2.5 px-3 py-3 text-left ${active ? "border-brand! bg-cream! ring-2 ring-brand/50" : ""}`}
            >
              <Icon size={20} className="shrink-0 text-brand" />
              <span>
                <span className="block text-[14px] font-semibold">{label}</span>
                <span className="block text-[11px] text-muted">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      )}

      <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Payment method">
        {methods.map(({ id, label, detail, icon: Icon }) => {
          const active = method === id;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={active}
              disabled={!isAdmin}
              onClick={() => planActions.setBooking({ method: id })}
              className={`card flex w-full items-center gap-3 px-3.5 py-2.5 text-left ${active ? "border-brand!" : ""}`}
            >
              <Icon size={22} className="text-brand" />
              <span className="flex-1">
                <span className="block text-[14px] font-semibold">{label}</span>
                <span className="block text-[11px] text-muted">{detail}</span>
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? "border-brand" : "border-ink/40"}`}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </span>
            </button>
          );
        })}
      </div>
      {atVenue && (
        <p className="mt-2 text-[11px] text-muted">
          Your slot is held until 15 minutes after {booking.slot}. Pay {rupees(q.total)} at the venue when you arrive.
        </p>
      )}

    </Screen>
  );
}
