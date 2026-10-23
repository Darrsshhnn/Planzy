"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock, MessageSquare, RotateCcw, Star, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { StickyFooter } from "@/components/layout/sticky-footer";
import { PlaceImage } from "@/components/place/place-image";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GroupFaces } from "@/components/ui/group-faces";
import { getPerson, getPlace } from "@/lib/api/data";
import { formatDateLong, rupees } from "@/lib/format";
import { CURRENT_USER_ID, planActions, usePlanById, usePlans } from "@/store/plan-store";

/** A finished outing: where you went, who with, how you rated it, and go again. */
export function OutingDetails({ planId }: { planId: string }) {
  const router = useRouter();
  const plan = usePlanById(planId);
  const { ready } = usePlans();
  if (!plan) {
    return ready ? (
      <Screen>
        <PageHeader title="Outing" backHref="/history" />
        <p className="mt-10 text-center text-[14px] text-muted">This outing isn&apos;t in your history.</p>
      </Screen>
    ) : null;
  }

  const place = getPlace(plan.chosenPlaceId) ?? getPlace(plan.shortlist[0]);
  const others = plan.memberIds.filter((id) => id !== CURRENT_USER_ID);

  const revisit = () => {
    planActions.start("popular", others, place?.id);
    router.push("/plan/friends");
  };

  const facts = [
    { icon: CalendarDays, label: formatDateLong(plan.date) },
    { icon: Clock, label: plan.booking.slot || plan.timeSlot },
    { icon: Users, label: `${plan.memberIds.length} people` },
    {
      icon: Wallet,
      label: plan.booking.amount ? rupees(plan.booking.amount) : place ? `~${rupees(place.pricePerPerson)} pp` : "-",
    },
  ];

  return (
    <Screen
      padded={false}
      withFooter
      overlay={
        <StickyFooter>
          <Button block onClick={revisit}>
            <RotateCcw size={18} /> Revisit this place
          </Button>
        </StickyFooter>
      }
    >
      <div className="relative">
        {place && <PlaceImage place={place} className="h-[230px] w-full" sizes="430px" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />
        <Link
          href="/history"
          aria-label="Back"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-ink"
        >
          <ChevronLeft size={24} />
        </Link>
        <div className="absolute inset-x-5 bottom-4 text-white">
          <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-ink">Completed</span>
          <h1 className="mt-1.5 font-heading text-[24px] font-bold leading-tight">{place?.name ?? plan.groupName}</h1>
          <p className="text-[13px] text-white/80">
            {plan.groupName} · {formatDateLong(plan.date)}
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 pt-5">
        {/* Rating */}
        <section className="reveal card p-4 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">
            {plan.rating ? "Your group rated it" : "How was it?"}
          </p>
          <div className="mt-2 flex justify-center gap-1.5" role={plan.rating ? undefined : "radiogroup"} aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => {
              const on = (plan.rating ?? 0) >= n - 0.25;
              return (
                <button
                  key={n}
                  disabled={!!plan.rating}
                  onClick={() => planActions.rateOuting(plan.id, n)}
                  aria-label={`${n} star`}
                  className="disabled:cursor-default"
                >
                  <Star size={32} className={on ? "fill-[#F7C028] stroke-[#F7C028]" : "stroke-ink/25"} />
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[22px] font-bold">{plan.rating ? plan.rating.toFixed(1) : "Tap to rate"}</p>
        </section>

        {/* Facts */}
        <section className="reveal grid grid-cols-4 gap-2">
          {facts.map(({ icon: Icon, label }) => (
            <div key={label} className="card flex flex-col items-center gap-1.5 px-1 py-3 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-brand">
                <Icon size={17} />
              </span>
              <span className="text-[11px] font-semibold leading-tight">{label}</span>
            </div>
          ))}
        </section>

        {/* Place */}
        {place && (
          <Link href={`/place/${place.id}`} className="reveal card flex items-center gap-3 p-3">
            <PlaceImage place={place} className="h-[64px] w-[72px] shrink-0 rounded-[10px]" sizes="72px" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">Place</span>
              <span className="block truncate text-[15px] font-semibold">{place.name}</span>
              <span className="block truncate text-[12px] text-muted">
                {place.category} · {place.area} · rated {place.rating.toFixed(1)}
              </span>
            </span>
            <ChevronRight size={20} className="text-ink/50" />
          </Link>
        )}

        {/* Group */}
        <section className="reveal card p-3.5">
          <div className="flex items-center gap-3">
            <GroupFaces ids={plan.memberIds} size={52} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Group</p>
              <p className="truncate text-[15px] font-semibold">{plan.groupName}</p>
              <p className="text-[12px] text-muted">Planned by {getPerson(plan.adminId).name}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {plan.memberIds.map((id) => (
              <span key={id} className="flex w-[56px] flex-col items-center gap-1">
                <Avatar personId={id} size={44} />
                <span className="w-full truncate text-center text-[11px]">
                  {id === CURRENT_USER_ID ? "You" : getPerson(id).name}
                </span>
              </span>
            ))}
          </div>
        </section>

        <Link
          href={`/chat/${plan.id}`}
          className="flex items-center justify-center gap-2 py-2 text-[14px] font-semibold text-navy underline underline-offset-2"
        >
          <MessageSquare size={16} /> Open the old chat
        </Link>
      </div>
    </Screen>
  );
}
