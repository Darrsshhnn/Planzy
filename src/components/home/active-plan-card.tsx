"use client";

import { CalendarCheck, ChevronRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { PlaceImage } from "@/components/place/place-image";
import { AvatarStack } from "@/components/ui/avatar";
import { SectionTitle } from "@/components/ui/card";
import { getPerson, getPlace } from "@/lib/api/data";
import { formatDateLong } from "@/lib/format";
import type { ChatMessage, PlanState } from "@/lib/types";
import { usePlan } from "@/store/plan-store";

/** Where the plan stands, and which screen continues it. */
function stageOf(plan: PlanState) {
  const { status } = plan.booking;
  if (status === "walk-in") return { title: "Confirmed Plan", label: "Walk-in", href: "/locked", cta: "View plan" };
  if (status === "pay-at-venue")
    return { title: "Confirmed Booking", label: "Pay at venue", href: "/locked", cta: "View booking" };
  if (status === "paid") return { title: "Confirmed Booking", label: "Booked", href: "/locked", cta: "View booking" };
  if (plan.locked) return { title: "Ongoing Chat", label: "Booking in progress", href: "/booking", cta: "Continue booking" };
  if (plan.decided) return { title: "Ongoing Chat", label: "Final decision", href: "/decision", cta: "Compare places" };
  return { title: "Ongoing Chat", label: "Voting open", href: "/chat", cta: "Open chat" };
}

function preview(m: ChatMessage | undefined) {
  if (!m) return "";
  if (m.kind === "system" || m.kind === "alert") return m.text;
  const who = getPerson(m.authorId).name;
  if (m.kind === "text") return `${who}: ${m.text}`;
  if (m.kind === "image") return `${who} shared a photo`;
  if (m.kind === "location") return `${who} shared a location`;
  return `${who} added ${getPlace(m.placeId)?.name ?? "a place"}`;
}

/** Top of Home: the confirmed booking, or the group chat still in progress. Hidden when there's no plan. */
export function ActivePlanCard() {
  const plan = usePlan();
  if (plan.messages.length === 0) return null;

  const stage = stageOf(plan);
  const booked = plan.booking.status !== "none";
  const place = getPlace(plan.chosenPlaceId) ?? getPlace(plan.shortlist[0]);

  return (
    <section className="mb-[22px]">
      <SectionTitle>{stage.title}</SectionTitle>
      <Link
        href={stage.href}
        className="mx-5 mt-3 block overflow-hidden card-dark text-white"
      >
        <div className="flex gap-3 p-3">
          {place ? (
            <PlaceImage place={place} className="h-[84px] w-[92px] shrink-0 rounded-[10px]" sizes="92px" />
          ) : (
            <span className="flex h-[84px] w-[92px] shrink-0 items-center justify-center rounded-[10px] bg-white/10">
              <MessageSquare size={28} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 text-[10px] font-semibold leading-[18px] ${booked ? "bg-brand text-white" : "bg-cream text-ink"}`}
            >
              {booked ? <CalendarCheck size={11} /> : <MessageSquare size={11} />}
              {stage.label}
            </span>
            <p className="mt-1 truncate font-heading text-[17px] font-bold">
              {booked && place ? place.name : plan.groupName}
            </p>
            <p className="truncate text-[11px] text-white/80">
              {booked
                ? `${formatDateLong(plan.date)} · ${plan.booking.slot || plan.timeSlot}`
                : `${plan.shortlist.length} places shortlisted · ${formatDateLong(plan.date)}`}
            </p>
            <p className="mt-1 truncate text-[11px] text-white/60">
              {booked ? `${plan.groupName}${plan.booking.status === "walk-in" ? " · No booking needed" : ` · Ref ${plan.booking.reference}`}` : preview(plan.messages.at(-1))}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2.5">
          <span className="flex items-center gap-2 text-[11px] text-white/80">
            <AvatarStack ids={plan.memberIds} size={24} max={4} ring="white" />
            {plan.memberIds.length} {booked ? "going" : "in the group"}
          </span>
          <span className="flex items-center gap-0.5 text-[13px] font-semibold text-brand">
            {stage.cta} <ChevronRight size={16} />
          </span>
        </div>
      </Link>
    </section>
  );
}
