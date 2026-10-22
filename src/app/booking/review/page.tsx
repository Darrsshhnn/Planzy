"use client";

import {
  Banknote,
  Building2,
  CalendarDays,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  QrCode,
  Smartphone,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PriceSummary } from "@/components/booking/price-summary";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceImage } from "@/components/place/place-image";
import { AvatarStack } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingBadge } from "@/components/ui/rating";
import { getPerson, getPlace } from "@/lib/api/data";
import { processPayment } from "@/lib/api/payments";
import { formatDateLong, rupees } from "@/lib/format";
import { quote } from "@/lib/pricing";
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
  const q = quote(place, booking.people);

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

  const atVenue = booking.payMode === "venue";
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

  const details: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: CalendarDays, label: "Date", value: formatDateLong(plan.date) },
    { icon: Clock, label: "Time", value: booking.slot },
    { icon: Users, label: "People", value: `${booking.people} ${booking.people === 1 ? "person" : "people"}` },
    { icon: MapPin, label: "Distance", value: `${place.distanceKm} km · ${place.area}` },
  ];

  return (
    <Screen
      overlay={
        paying && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm">
            <Loader2 size={40} className="animate-spin text-brand" />
            <p className="text-[15px] font-semibold">Processing {rupees(q.total)}…</p>
            <p className="text-[12px] text-muted">Mock payment, no real money is charged</p>
          </div>
        )
      }
    >
      <PageHeader title="Review & Confirm" backHref="/booking" />

      {/* Booking summary: a ticket with a perforated tear line. */}
      <section className="card overflow-hidden p-0!" aria-label="Booking summary">
        <div className="relative h-[120px]">
          <PlaceImage place={place} className="h-full w-full" sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <RatingBadge value={place.rating} className="absolute right-3 top-3" />
          <div className="absolute inset-x-3 bottom-2.5 text-white">
            <p className="text-[11px] uppercase tracking-wide text-white/75">Booking summary</p>
            <h2 className="font-heading text-[20px] font-bold leading-tight">{place.name}</h2>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 px-4 pb-3 pt-4">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-brand">
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] text-muted">{label}</dt>
                <dd className="truncate text-[13px] font-semibold">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-2 px-4 pb-4 text-[12px]">
          <AvatarStack ids={plan.memberIds} size={26} max={6} />
          <span className="min-w-0 truncate text-muted">
            {plan.groupName} · booked by {getPerson(plan.adminId).name}
          </span>
        </div>

        <div className="relative h-0 border-t-2 border-dashed border-ink/20" aria-hidden>
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-ink bg-white" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-ink bg-white" />
        </div>

        <div className="px-4 pb-4 pt-4">
          <PriceSummary place={place} people={booking.people} atVenue={atVenue} />
        </div>
      </section>

      <h3 className="mt-6 font-heading text-[18px] font-bold">How do you want to pay?</h3>
      <div className="mt-2.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="When to pay">
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

      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Payment method">
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

      <div className="mt-5 px-1.5">
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
        <p className="mt-3 text-center text-[11px] text-muted">Free cancellation up to 2 hours before the booking.</p>
      </div>
    </Screen>
  );
}
