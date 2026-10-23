"use client";

import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { GroupPrefsPanel } from "@/components/plan/group-prefs-panel";
import { PlanStep } from "@/components/plan/plan-step";
import { FieldBox, FieldLabel } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { RangeField } from "@/components/ui/range-field";
import { Toggle } from "@/components/ui/toggle";
import { suggestTimeSlot } from "@/lib/live";
import { groupPrefs } from "@/lib/group-prefs";
import { MIN_RECOMMENDATIONS, recommend } from "@/lib/recommend";
import { SLOT_LABELS, TIME_SLOTS } from "@/lib/time";
import { planActions, usePlan } from "@/store/plan-store";

export default function PreferencesPage() {
  const router = useRouter();
  const plan = usePlan();
  const isPopular = plan.flow === "popular";
  const suggestion = suggestTimeSlot([...plan.memberIds, ...Object.keys(plan.invites)]);

  const next = (skipped: boolean) => {
    planActions.setPrefsSkipped(skipped);
    if (isPopular) {
      // Popular flow already has its place: skip Recommendation, create the group.
      const id = planActions.openGroupChat();
      router.replace(`/chat/${id}`);
      return;
    }
    if (!plan.created) {
      const merged = { ...plan, prefsSkipped: skipped };
      const top = recommend({ ...merged, ...groupPrefs(merged) }).slice(0, MIN_RECOMMENDATIONS);
      planActions.setShortlist(top.map((r) => r.place.id));
    }
    router.push("/plan/recommendations");
  };

  return (
    <PlanStep
      backHref="/plan/group"
      onContinue={() => next(false)}
      onSkip={() => next(true)}
      continueLabel={isPopular ? "Create Group Chat" : "Continue"}
    >
      <p className="-mt-1 mb-4 text-[12px] text-muted">
        Your budget, distance and timing. Everyone who accepts adds theirs, and we suggest places for the group
        average. You can skip this.
      </p>
      <FieldLabel>Budget Range / Person</FieldLabel>
      <FieldBox className="mt-3">
        <RangeField
          label="Budget per person"
          value={plan.budget}
          min={100}
          max={1000}
          step={50}
          marks={["₹500", "₹1000"]}
          format={(v) => `₹${v}`}
          onChange={planActions.setBudget}
        />
      </FieldBox>

      <FieldLabel className="mt-5">Distance / Radius</FieldLabel>
      <FieldBox className="mt-3">
        <RangeField
          label="Maximum distance"
          value={plan.distance}
          min={2}
          max={25}
          step={1}
          marks={["10 km", "25 km"]}
          format={(v) => `${v} km`}
          tone="navy"
          onChange={planActions.setDistance}
        />
      </FieldBox>

      <h3 className="mt-5 font-heading text-[16px] font-bold">Timing</h3>
      <FieldBox className="mt-2.5 p-3.5">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Time of day">
          {TIME_SLOTS.map((t) => (
            <Chip
              key={t}
              role="radio"
              aria-checked={plan.timeSlot === t}
              selected={plan.timeSlot === t}
              onClick={() => planActions.setTimeSlot(t)}
              className="!h-[38px] flex-1 !px-0 !text-[12px]"
            >
              {t}
            </Chip>
          ))}
        </div>
        {suggestion && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-[8px] bg-cream px-3 py-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[12px]">
              <Sparkles size={14} className="shrink-0 text-brand" />
              <span>
                <span className="font-semibold">{suggestion.slot}</span> suits your group: {suggestion.count} of{" "}
                {suggestion.total} usually go out then
              </span>
            </span>
            {plan.timeSlot === suggestion.slot ? (
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand">
                <Check size={13} /> Applied
              </span>
            ) : (
              <button
                onClick={() => planActions.setTimeSlot(suggestion.slot)}
                className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                Use
              </button>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between rounded-[8px] border border-ink px-3.5 py-2">
          <span className="text-[14px]">Time</span>
          <span className="rounded-full border border-ink bg-cream px-3 py-1 text-[13px]">
            {SLOT_LABELS[plan.timeSlot]}
          </span>
        </div>
      </FieldBox>

      <h3 className="mt-5 font-heading text-[16px] font-bold">Availability</h3>
      <FieldBox className="mt-2.5 flex items-center justify-between py-2 pl-3.5 pr-2.5">
        <span className="text-[14px]">Only Places open at that time.</span>
        <Toggle checked={plan.onlyOpen} onChange={planActions.setOnlyOpen} label="Only places open at that time" />
      </FieldBox>

      <GroupPrefsPanel plan={plan} />
    </PlanStep>
  );
}
