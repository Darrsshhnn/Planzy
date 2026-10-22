"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceImage } from "@/components/place/place-image";
import { AvatarStack } from "@/components/ui/avatar";
import { RatingPill } from "@/components/ui/rating";
import { getPlace, getRecents } from "@/lib/api/data";
import { formatDateLong } from "@/lib/format";
import type { Place } from "@/lib/types";
import { usePlan } from "@/store/plan-store";

function HistoryRow({
  href,
  place,
  title,
  subtitle,
  memberIds,
  badge,
}: {
  href: string;
  place?: Place;
  title: string;
  subtitle: string;
  memberIds: string[];
  badge?: ReactNode;
}) {
  return (
    <li>
      <Link href={href} className="flex gap-3 card p-2.5">
        {place && <PlaceImage place={place} className="h-[64px] w-[72px] shrink-0 rounded-[8px]" sizes="72px" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[14px] font-semibold">{title}</p>
            {badge}
          </div>
          <p className="truncate text-[11px] text-muted">{subtitle}</p>
          <div className="mt-1.5">
            <AvatarStack ids={memberIds} size={22} max={5} />
          </div>
        </div>
      </Link>
    </li>
  );
}

/** Full history: opened from Home > Recents > See all and Profile > History. */
export default function HistoryPage() {
  const plan = usePlan();
  const booked = plan.booking.status !== "none";
  const chosen = getPlace(plan.chosenPlaceId);
  const ongoing = plan.messages.length > 0 && !booked;

  return (
    <Screen>
      <PageHeader title="History" />

      {(booked || ongoing) && (
        <section>
          <h2 className="font-heading text-[18px] font-bold">{booked ? "Upcoming" : "Ongoing"}</h2>
          <ul className="mt-2.5 space-y-3">
            {booked ? (
              <HistoryRow
                href="/locked"
                place={chosen}
                title={chosen?.name ?? plan.groupName}
                subtitle={`${plan.groupName} · ${formatDateLong(plan.date)} · ${plan.booking.slot}`}
                memberIds={plan.memberIds}
                badge={<span className="shrink-0 rounded-full bg-brand px-2 text-[10px] font-semibold leading-[18px] text-white">Booked</span>}
              />
            ) : (
              <HistoryRow
                href="/chat"
                place={getPlace(plan.shortlist[0])}
                title={plan.groupName}
                subtitle={`${plan.shortlist.length} places shortlisted · ${formatDateLong(plan.date)}`}
                memberIds={plan.memberIds}
                badge={<span className="shrink-0 rounded-full bg-cream px-2 text-[10px] font-semibold leading-[18px]">Chat</span>}
              />
            )}
          </ul>
        </section>
      )}

      <section className={booked || ongoing ? "mt-7" : ""}>
        <h2 className="font-heading text-[18px] font-bold">Past outings</h2>
        <ul className="mt-2.5 space-y-3">
          {getRecents().map((r) => {
            const place = getPlace(r.placeId)!;
            return (
              <HistoryRow
                key={r.id}
                href={`/place/${place.id}`}
                place={place}
                title={r.groupName}
                subtitle={`${place.name} · ${place.area}, Ahmedabad`}
                memberIds={r.memberIds}
                badge={<RatingPill value={r.rating} />}
              />
            );
          })}
        </ul>
      </section>
    </Screen>
  );
}
