"use client";

import { ChevronRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { AiIcon } from "@/components/brand/ai-icon";
import { FeaturedPlaceCard, RecentCard } from "@/components/place/place-cards";
import { ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/card";
import { getFeaturedPlaces, getPlace, getRecents } from "@/lib/api/data";
import { recommend, type Recommendation } from "@/lib/recommend";
import type { RecentOuting } from "@/lib/types";
import { useIsNewUser, useProfile } from "@/store/account-store";
import { CURRENT_USER_ID, usePlans } from "@/store/plan-store";

const seeAll = (
  <Link href="/history" className="text-[13px] font-medium text-navy underline underline-offset-2">
    See All
  </Link>
);

/**
 * Recents: past outings. Existing users see theirs; a brand-new account sees
 * nothing here until it has been out with Planzy once.
 */
export function HomeRecents() {
  const isNew = useIsNewUser();
  const { plans } = usePlans();

  const outings: (RecentOuting & { href?: string })[] = isNew
    ? plans
        .filter((p) => p.archived && !p.id.startsWith("old-") && p.memberIds.includes(CURRENT_USER_ID) && getPlace(p.chosenPlaceId))
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((p) => ({
          id: p.id,
          href: `/history/${p.id}`,
          groupName: p.groupName,
          placeId: p.chosenPlaceId!,
          rating: p.rating ?? getPlace(p.chosenPlaceId)!.rating,
          memberIds: p.memberIds,
        }))
    : getRecents();

  if (outings.length === 0) return null;
  return (
    <section className="mt-9">
      <SectionTitle action={seeAll}>Recents</SectionTitle>
      <div className="carousel mt-3">
        {outings.map((r) => (
          <RecentCard key={r.id} outing={r} href={r.href} place={getPlace(r.placeId)!} />
        ))}
      </div>
    </section>
  );
}

/** Up to `count` picks, one per liked category first so the list isn't all one kind. */
function varied(list: Recommendation[], count: number) {
  const out: Recommendation[] = [];
  for (const r of list) if (!out.some((o) => o.place.category === r.place.category)) out.push(r);
  for (const r of list) if (!out.includes(r)) out.push(r);
  return out.slice(0, count);
}

/**
 * Recommendation, personalised: places picked from your interests, budget,
 * distance and timing, each with its match and why it was picked. Without
 * interests set, the editor's featured places show instead.
 */
export function RecommendedForYou() {
  const profile = useProfile();
  const { categories, budget, distance, timeSlot } = profile.preferences;
  const personal = categories.length > 0;
  const picks = personal
    ? varied(recommend({ categories, budget, distance: Math.max(distance, 15), timeSlot, onlyOpen: false }, 8), 3)
    : null;

  return (
    <section className="mt-10">
      <SectionTitle
        action={
          <Link href="/search" aria-label="Filter places" className="rounded-lg p-1 text-ink hover:bg-ink/5">
            <SlidersHorizontal size={22} />
          </Link>
        }
      >
        {personal ? "Recommended for you" : "Recommendation"}
      </SectionTitle>
      {personal && (
        <p className="mt-1 px-5 text-[12px] text-muted">
          Because you like {categories.join(", ").toLowerCase()} ·{" "}
          <Link href="/profile/preferences" className="text-navy underline underline-offset-2">
            Edit
          </Link>
        </p>
      )}
      <div className="mt-4 space-y-7 px-5">
        {picks
          ? picks.map((r, i) => (
              <FeaturedPlaceCard
                key={r.place.id}
                place={r.place}
                priority={i === 0}
                match={r.match}
                reason={whyPicked(r, budget)}
              />
            ))
          : getFeaturedPlaces().map((p, i) => <FeaturedPlaceCard key={p.id} place={p} priority={i === 0} />)}
        <ButtonLink href="/search" variant="dark" block className="!h-[46px] !text-[16px]">
          Explore More
        </ButtonLink>
      </div>
    </section>
  );
}

function whyPicked(r: Recommendation, budget: number) {
  const p = r.place;
  const price = p.hourly ? `₹${p.hourly.rate}/hr per ${p.hourly.unit}` : `about ₹${p.pricePerPerson} a head`;
  const fits = p.hourly || p.pricePerPerson <= budget ? "inside your budget" : "a little over budget";
  return `${p.category} you'll like, ${price}, ${fits}.`;
}

/** Entry to Planzy Scout, on Home for every user. */
export function AiCard() {
  return (
    <Link href="/ai" className="reveal scout-ring mx-5 flex items-center gap-4 p-4 text-white">
      <span className="scout-glow relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand">
        <AiIcon size={26} />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-heading text-[17px] font-bold">Scout</span>
          <span className="rounded-full bg-cream px-1.5 text-[9px] font-bold uppercase tracking-wider text-ink">AI</span>
        </span>
        <span className="mt-0.5 block text-[12px] leading-[16px] text-white/70">
          Pick an area, budget and distance. Scout finds the spots.
        </span>
      </span>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
        <ChevronRight size={20} className="text-brand" />
      </span>
    </Link>
  );
}
