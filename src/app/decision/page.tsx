"use client";

import { BellRing, Check, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceImage } from "@/components/place/place-image";
import { RoleSwitch } from "@/components/plan/role-switch";
import { AvatarStack } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { PlanCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPerson, getPlace } from "@/lib/api/data";
import { rupees } from "@/lib/format";
import { formatTime, isOpenDuring } from "@/lib/time";
import type { Place } from "@/lib/types";
import { rankShortlist, type Tally } from "@/lib/votes";
import { planActions, usePlan } from "@/store/plan-store";
import { useViewer } from "@/store/viewer-store";

const MAX_COMPARE = 3;

interface Row {
  label: string;
  render: (p: Place, t: Tally) => ReactNode;
  /** Index of the best column, highlighted in orange. */
  best?: (items: { place: Place; tally: Tally }[]) => number;
}

const argBest = (values: number[], dir: "max" | "min") =>
  values.indexOf(dir === "max" ? Math.max(...values) : Math.min(...values));

export default function FinalDecisionPage() {
  const router = useRouter();
  const plan = usePlan();
  const { isAdmin } = useViewer();
  const [blocked, setBlocked] = useState<string | null>(null);

  if (!plan.decided) {
    return (
      <Screen>
        <PageHeader title="Final Decision" backHref={plan.id ? `/chat/${plan.id}` : "/chat"} />
        <EmptyState
          icon={Scale}
          title="Voting is still open"
          body="When the group has voted, the admin taps Decide in the chat to compare the top places here."
          action={
            <ButtonLink href={plan.id ? `/chat/${plan.id}` : "/chat"} block>
              Back to Group Chat
            </ButtonLink>
          }
        />
      </Screen>
    );
  }

  const items = rankShortlist(plan, getPlace).slice(0, MAX_COMPARE);
  // The group's vote decides: only places tied for the top score can be picked.
  const topScore = items[0]?.tally.score ?? 0;
  const majority = items.filter((i) => topScore === 0 || i.tally.score === topScore);
  const isMajority = (id: string) => majority.some((m) => m.place.id === id);
  const chosen =
    items.find((i) => i.place.id === plan.chosenPlaceId && isMajority(i.place.id)) ?? majority[0] ?? items[0];
  const adminName = getPerson(plan.adminId).name;

  const pick = (placeId: string) => {
    if (isMajority(placeId)) {
      setBlocked(null);
      planActions.choosePlace(placeId);
      return;
    }
    // Admin tried to go against the vote: don't allow it, and tell the group.
    const tried = getPlace(placeId)?.name ?? "another place";
    const voted = majority.map((m) => m.place.name).join(" / ");
    planActions.notifyGroup(
      `${adminName} (admin) tried to choose ${tried}, but the group voted for ${voted}. The group's vote stands.`,
    );
    setBlocked(`The group voted for ${voted}. You can't pick ${tried} over the vote; the group has been notified.`);
  };

  const rows: Row[] = [
    {
      label: "Votes",
      render: (_, t) => (
        <>
          <span className="font-semibold text-brand">{t.in.length} In</span>
          <br />
          {t.maybe.length} Maybe · {t.cant.length} No
        </>
      ),
      best: (xs) => argBest(xs.map((x) => x.tally.score), "max"),
    },
    {
      label: "Budget / person",
      render: (p) => rupees(p.pricePerPerson),
      best: (xs) => argBest(xs.map((x) => x.place.pricePerPerson), "min"),
    },
    {
      label: "Distance",
      render: (p) => `${p.distanceKm} km`,
      best: (xs) => argBest(xs.map((x) => x.place.distanceKm), "min"),
    },
    {
      label: "Rating",
      render: (p) => `${p.rating.toFixed(1)} (${p.reviewsCount})`,
      best: (xs) => argBest(xs.map((x) => x.place.rating), "max"),
    },
    { label: "Hours", render: (p) => `${formatTime(p.open)} – ${formatTime(p.close)}` },
    {
      label: `Open ${plan.timeSlot.toLowerCase()}`,
      render: (p) => (isOpenDuring(p, plan.timeSlot) ? "Yes" : "No"),
    },
    { label: "Right now", render: (p) => `${p.live.crowd}` },
  ];

  const isFood = chosen?.place.category === "Food";
  const lock = () => {
    if (!chosen || !isMajority(chosen.place.id)) return;
    planActions.choosePlace(chosen.place.id);
    planActions.lockChoice();
    // Food places: no booking or pre-payment for now, straight to Locked In.
    router.push(isFood ? "/locked" : "/booking");
  };

  const cols = `78px repeat(${items.length}, minmax(0, 1fr))`;

  return (
    <Screen>
      <PageHeader title="Final Decision" backHref={`/chat/${plan.id}`} subtitle={plan.groupName} />
      <RoleSwitch />

      <PlanCard className="mt-3 !px-3">
        <h2 className="px-1 font-heading text-[18px] font-bold">Between {items.length} places</h2>
        <p className="mt-0.5 px-1 text-[11px] text-muted">
          Ranked by votes. Orange marks the best value in each row.
          {isAdmin ? " The group's top-voted place is the pick." : ""}
        </p>

        <div className="mt-3 grid gap-x-1.5" style={{ gridTemplateColumns: cols }}>
          <span />
          {items.map(({ place }, i) => {
            const selected = chosen?.place.id === place.id;
            return (
              <button
                key={place.id}
                disabled={!isAdmin}
                onClick={() => pick(place.id)}
                aria-pressed={selected}
                className={[
                  "relative overflow-hidden rounded-[10px] border bg-paper p-1 text-left transition disabled:cursor-default",
                  selected ? "border-brand ring-2 ring-brand" : "border-ink",
                  isAdmin && !isMajority(place.id) ? "opacity-60" : "",
                ].join(" ")}
              >
                <PlaceImage place={place} className="h-[58px] w-full rounded-[7px]" sizes="110px" />
                <p className="mt-1 line-clamp-2 min-h-[28px] text-[11px] font-semibold leading-[14px]">{place.name}</p>
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-1.5 text-[8px] font-bold uppercase leading-[14px] text-white">
                    Top
                  </span>
                )}
                {selected && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}

          {rows.map((row) => {
            const best = items.length > 1 ? row.best?.(items) : undefined;
            return (
              <div key={row.label} className="contents">
                <span className="flex items-center border-t border-ink/10 py-2 pr-1 text-[11px] font-medium text-muted">
                  {row.label}
                </span>
                {items.map(({ place, tally: t }, i) => (
                  <span
                    key={place.id}
                    className={`block border-t border-ink/10 py-2 text-[11px] leading-[15px] ${best === i ? "font-semibold text-brand" : "text-ink"}`}
                  >
                    {row.render(place, t)}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </PlanCard>

      {blocked && (
        <div className="card mt-4 flex items-start gap-2.5 border-brand! bg-cream! p-3" role="alert">
          <BellRing size={18} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-[13px] leading-[18px]">{blocked}</p>
        </div>
      )}

      {chosen && (
        <div className="card mt-4 p-4">
          <p className="text-[12px] text-muted">{isAdmin ? "Your pick" : `${getPerson(plan.adminId).name}'s pick`}</p>
          <p className="font-heading text-[18px] font-bold">{chosen.place.name}</p>
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            <AvatarStack ids={chosen.tally.in} size={26} max={5} />
            <span>
              {chosen.tally.in.length
                ? `${chosen.tally.in.map((id) => getPerson(id).name).join(", ")} voted In`
                : "No In votes yet"}
            </span>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3 px-1.5">
        {isAdmin ? (
          <>
            <Button block onClick={lock} disabled={!chosen}>
              {isFood ? "Lock place (walk-in)" : "Lock & Book"}
            </Button>
            {isFood && (
              <p className="-mt-1 text-center text-[11px] text-muted">
                Food places don&apos;t need booking or pre-payment. Just walk in.
              </p>
            )}
            <Button
              block
              variant="ghost"
              size="md"
              onClick={() => {
                planActions.reopenVoting();
                router.push(`/chat/${plan.id}`);
              }}
            >
              Reopen voting
            </Button>
          </>
        ) : plan.locked ? (
          <ButtonLink href={plan.booking.status === "walk-in" ? "/locked" : "/booking"} block>
            See booking status
          </ButtonLink>
        ) : (
          <p className="rounded-[10px] bg-cream p-3 text-center text-[13px]">
            Waiting for {getPerson(plan.adminId).name} (admin) to lock the final place.
          </p>
        )}
      </div>
    </Screen>
  );
}
