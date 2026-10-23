import { ChevronRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { ActivePlanCard } from "@/components/home/active-plan-card";
import { HomeHeader } from "@/components/home/home-header";
import { GroupsRow } from "@/components/home/groups-row";
import { Screen } from "@/components/layout/screen";
import { FeaturedPlaceCard, NearbyCard, RecentCard } from "@/components/place/place-cards";
import { ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/card";
import { getFeaturedPlaces, getNearbyPlaces, getPlace, getRecents } from "@/lib/api/data";

const filterLink = (
  <Link href="/search" aria-label="Filter places" className="rounded-lg p-1 text-ink hover:bg-ink/5">
    <SlidersHorizontal size={24} />
  </Link>
);

export default function HomePage() {
  return (
    <Screen padded={false}>
      <HomeHeader />

      {/* Hierarchy: active plan > Recents > Recommendation > Groups > Nearby */}
      <ActivePlanCard />

      <SectionTitle
        action={
          <Link href="/history" className="text-[13px] font-medium text-navy underline underline-offset-2">
            See All
          </Link>
        }
      >
        Recents
      </SectionTitle>
      <div className="carousel mt-1.5">
        {getRecents().map((r) => (
          <RecentCard key={r.id} outing={r} place={getPlace(r.placeId)!} />
        ))}
      </div>

      <div className="mt-[22px]">
        <SectionTitle action={filterLink}>Recommendation</SectionTitle>
      </div>
      <div className="mt-1.5 space-y-5 px-5">
        {getFeaturedPlaces().map((p, i) => (
          <FeaturedPlaceCard key={p.id} place={p} priority={i === 0} />
        ))}
        <ButtonLink href="/search" variant="dark" block className="!h-[46px] !text-[16px]">
          Explore More
        </ButtonLink>
      </div>

      <div className="mt-[26px]">
        <Link href="/profile/groups" className="flex items-center gap-1 px-5">
          <h2 className="font-heading text-[19px] font-bold">Groups</h2>
          <ChevronRight size={24} />
        </Link>
      </div>
      <div className="mt-2">
        <GroupsRow />
      </div>

      <div className="mt-[26px]">
        <SectionTitle>Nearby Places</SectionTitle>
      </div>
      <div className="carousel mt-1.5">
        {getNearbyPlaces().map((p) => (
          <NearbyCard key={p.id} place={p} />
        ))}
      </div>
    </Screen>
  );
}
