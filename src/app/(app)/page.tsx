import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ActivePlanCard } from "@/components/home/active-plan-card";
import { HomeHeader } from "@/components/home/home-header";
import { AiCard, HomeRecents, RecommendedForYou } from "@/components/home/home-for-you";
import { GroupsRow } from "@/components/home/groups-row";
import { Screen } from "@/components/layout/screen";
import { NearbyCard } from "@/components/place/place-cards";
import { SectionTitle } from "@/components/ui/card";
import { getNearbyPlaces } from "@/lib/api/data";

export default function HomePage() {
  return (
    <Screen padded={false}>
      <HomeHeader />

      {/* Hierarchy: active plan > Recents > Planzy Scout > Recommended for you > Groups > Nearby */}
      <ActivePlanCard />
      <HomeRecents />

      <div className="mt-9">
        <AiCard />
      </div>

      <RecommendedForYou />

      <section className="mt-10">
        <Link href="/profile/groups" className="flex items-center gap-1 px-5">
          <h2 className="font-heading text-[19px] font-bold">Groups</h2>
          <ChevronRight size={22} />
        </Link>
        <div className="mt-3">
          <GroupsRow />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle>Nearby Places</SectionTitle>
        <div className="carousel mt-3">
          {getNearbyPlaces().map((p) => (
            <NearbyCard key={p.id} place={p} />
          ))}
        </div>
      </section>
    </Screen>
  );
}
