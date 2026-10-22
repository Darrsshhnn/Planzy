"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceImage } from "@/components/place/place-image";
import { AvatarStack } from "@/components/ui/avatar";
import { RatingPill } from "@/components/ui/rating";
import { getPlace } from "@/lib/api/data";
import { formatDateLong } from "@/lib/format";
import type { Place, PlanState } from "@/lib/types";
import { CURRENT_USER_ID, usePlans } from "@/store/plan-store";

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
    <li className="reveal">
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
  const { plans } = usePlans();
  const mine = plans
    .filter((p) => p.created && p.memberIds.includes(CURRENT_USER_ID))
    .sort((a, b) => b.createdAt - a.createdAt);
  const upcoming = mine.filter((p) => !p.archived && p.booking.status !== "none");
  const ongoing = mine.filter((p) => !p.archived && p.booking.status === "none");
  const past = mine.filter((p) => p.archived);

  const row = (p: PlanState, badge: ReactNode) => {
    const place = getPlace(p.chosenPlaceId) ?? getPlace(p.shortlist[0]);
    return (
      <HistoryRow
        key={p.id}
        href={`/chat/${p.id}`}
        place={place}
        title={p.archived || p.booking.status !== "none" ? (place?.name ?? p.groupName) : p.groupName}
        subtitle={`${p.groupName} · ${formatDateLong(p.date)}`}
        memberIds={p.memberIds}
        badge={badge}
      />
    );
  };
  const pill = (label: string, className: string) => (
    <span className={`shrink-0 rounded-full px-2 text-[10px] font-semibold leading-[18px] ${className}`}>{label}</span>
  );

  return (
    <Screen>
      <PageHeader title="History" />
      {upcoming.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading text-[16px] font-bold">Upcoming</h2>
          <ul className="mt-2.5 space-y-3">{upcoming.map((p) => row(p, pill("Booked", "bg-brand text-white")))}</ul>
        </section>
      )}
      {ongoing.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading text-[16px] font-bold">Ongoing</h2>
          <ul className="mt-2.5 space-y-3">{ongoing.map((p) => row(p, pill("Chat", "bg-cream")))}</ul>
        </section>
      )}
      <section>
        <h2 className="font-heading text-[16px] font-bold">Past outings</h2>
        <ul className="mt-2.5 space-y-3">
          {past.map((p) => row(p, <RatingPill value={getPlace(p.chosenPlaceId)?.rating ?? 4} />))}
          {past.length === 0 && <li className="text-[13px] text-muted">No past outings yet.</li>}
        </ul>
      </section>
    </Screen>
  );
}
