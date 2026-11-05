"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { NearbyCard, RecentCard } from "@/components/place/place-cards";
import { SectionTitle } from "@/components/ui/card";
import { getPlace, getRecents } from "@/lib/api/data";
import { recommend } from "@/lib/recommend";
import type { RecentOuting } from "@/lib/types";
import { useIsNewUser, useProfile } from "@/store/account-store";
import { CURRENT_USER_ID, usePlans } from "@/store/plan-store";

const seeAll = (
  <Link href="/history" className="text-[13px] font-medium text-navy underline underline-offset-2">
    See All
  </Link>
);

/** Places matched to the interests picked at sign-up (budget, timing too). */
function PlacesYouMightLike() {
  const profile = useProfile();
  const { categories, budget, distance, timeSlot } = profile.preferences;
  const picks = recommend({ categories, budget, distance: Math.max(distance, 15), timeSlot, onlyOpen: false }, 6);
  return (
    <>
      <SectionTitle
        action={
          <Link href="/profile/preferences" className="text-[13px] font-medium text-navy underline underline-offset-2">
            Edit interests
          </Link>
        }
      >
        Places you might like
      </SectionTitle>
      <p className="-mt-0.5 px-5 text-[12px] text-muted">
        {categories.length ? `Because you like ${categories.join(", ").toLowerCase()}` : "Popular with groups near you"}
      </p>
      <div className="carousel mt-2">
        {picks.map((r) => (
          <NearbyCard key={r.place.id} place={r.place} match={r.match} note={r.place.category} />
        ))}
      </div>
    </>
  );
}

/**
 * Second block on Home. Someone who has been out with Planzy sees Recents.
 * A brand-new account has no outings yet, so it sees places picked from the
 * interests chosen at sign-up instead (plus its own outings once it has some).
 */
export function HomeForYou() {
  const isNew = useIsNewUser();
  const { plans } = usePlans();

  if (!isNew) {
    return (
      <>
        <SectionTitle action={seeAll}>Recents</SectionTitle>
        <div className="carousel mt-1.5">
          {getRecents().map((r) => (
            <RecentCard key={r.id} outing={r} place={getPlace(r.placeId)!} />
          ))}
        </div>
      </>
    );
  }

  const own: (RecentOuting & { href: string })[] = plans
    .filter((p) => p.archived && !p.id.startsWith("old-") && p.memberIds.includes(CURRENT_USER_ID) && getPlace(p.chosenPlaceId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((p) => ({
      id: p.id,
      href: `/history/${p.id}`,
      groupName: p.groupName,
      placeId: p.chosenPlaceId!,
      rating: p.rating ?? getPlace(p.chosenPlaceId)!.rating,
      memberIds: p.memberIds,
    }));

  return (
    <>
      {own.length > 0 && (
        <div className="mb-[22px]">
          <SectionTitle action={seeAll}>Recents</SectionTitle>
          <div className="carousel mt-1.5">
            {own.map((r) => (
              <RecentCard key={r.id} outing={r} href={r.href} place={getPlace(r.placeId)!} />
            ))}
          </div>
        </div>
      )}
      <PlacesYouMightLike />
    </>
  );
}

/** Entry to Planzy AI, on Home for every user. */
export function AiCard() {
  return (
    <Link
      href="/ai"
      className="reveal card-dark relative mx-5 flex items-center gap-3 overflow-hidden p-3.5 text-white"
    >
      <span className="pointer-events-none absolute -left-6 -top-8 h-24 w-24 rounded-full bg-brand/35 blur-2xl" />
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brand">
        <Sparkles size={22} />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-heading text-[16px] font-bold">Ask Planzy AI</span>
        <span className="block text-[11px] leading-[15px] text-white/75">
          Tell it the vibe, your area and budget. Get places picked for your group.
        </span>
      </span>
      <ChevronRight size={22} className="relative shrink-0 text-brand" />
    </Link>
  );
}
