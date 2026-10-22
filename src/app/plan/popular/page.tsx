"use client";

import { useRouter } from "next/navigation";
import { PlanStep } from "@/components/plan/plan-step";
import { PlaceRowCard } from "@/components/place/place-cards";
import { getPopularPlaces } from "@/lib/api/data";
import { planActions, usePlan } from "@/store/plan-store";

export default function PopularPlacesPage() {
  const router = useRouter();
  const { shortlist } = usePlan();
  const chosen = shortlist[0];

  return (
    <PlanStep
      backHref="/plan/start"
      onContinue={() => router.push("/plan/friends")}
      canContinue={!!chosen}
      hint="Pick one place to start with"
    >
      <h2 className="font-heading text-[20px] font-bold">Popular Places</h2>
      <p className="mt-1 text-[12px] text-muted">Pick one. Your group can add more places in the chat.</p>
      <div className="mt-4 space-y-4">
        {getPopularPlaces().map((p) => (
          <PlaceRowCard
            key={p.id}
            place={p}
            selected={chosen === p.id}
            onSelect={() => planActions.choosePopularPlace(p.id)}
          />
        ))}
      </div>
    </PlanStep>
  );
}
