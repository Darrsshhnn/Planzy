"use client";

import { useRouter } from "next/navigation";
import { GroupPrefsPanel } from "@/components/plan/group-prefs-panel";
import { PlanStep } from "@/components/plan/plan-step";
import { PlaceRowCard } from "@/components/place/place-cards";
import { groupPrefs } from "@/lib/group-prefs";
import { recommend } from "@/lib/recommend";
import { planActions, usePlan } from "@/store/plan-store";

export default function RecommendationPage() {
  const router = useRouter();
  const plan = usePlan();
  // Suggestions follow the group's average budget / distance / timing, live.
  const recs = recommend({ ...plan, ...groupPrefs(plan) });
  const count = plan.shortlist.length;

  const create = () => {
    const id = planActions.openGroupChat();
    // Replace, so Back from the new chat goes to Chats, not this screen.
    router.replace(`/chat/${id}`);
  };

  return (
    <PlanStep
      backHref="/plan/preferences"
      onContinue={create}
      continueLabel={count ? `Create group · share ${count}` : "Create group"}
    >
      <h2 className="font-heading text-[17px] font-bold">Recommendation</h2>
      <p className="mt-1 text-[12px] text-muted">
        Matched to the group&apos;s average budget, distance and timing. Tap a card to add or remove it. You can also
        skip picking and add places later in the chat.
      </p>
      <GroupPrefsPanel plan={plan} />
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
