"use client";

import { useRouter } from "next/navigation";
import { PlanStep } from "@/components/plan/plan-step";
import { PlaceRowCard } from "@/components/place/place-cards";
import { recommend } from "@/lib/recommend";
import { planActions, usePlan } from "@/store/plan-store";

export default function RecommendationPage() {
  const router = useRouter();
  const plan = usePlan();
  const recs = recommend(plan);
  const count = plan.shortlist.length;

  return (
    <PlanStep
      backHref="/plan/preferences"
      onContinue={() => {
        planActions.openGroupChat();
        router.push("/chat");
      }}
      canContinue={count > 0}
      hint="Select at least one place for the shortlist"
      continueLabel={count ? `Share ${count} with group` : "Continue"}
    >
      <h2 className="font-heading text-[20px] font-bold">Recommendation</h2>
      <p className="mt-1 text-[12px] text-muted">
        Matched to your group&apos;s budget, distance and timing. Tap a card to add or remove it from the shortlist.
      </p>
      <div className="mt-4 space-y-4">
        {recs.map((r) => (
          <PlaceRowCard
            key={r.place.id}
            place={r.place}
            selected={plan.shortlist.includes(r.place.id)}
            onSelect={() => planActions.toggleShortlist(r.place.id)}
            note={r.relaxed ? r.reasons[0] : undefined}
            match={r.match}
          />
        ))}
      </div>
    </PlanStep>
  );
}
