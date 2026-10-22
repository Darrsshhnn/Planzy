"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { RangeField } from "@/components/ui/range-field";
import { Sheet } from "@/components/ui/sheet";
import { TIME_SLOTS } from "@/lib/time";
import type { PlanState, TimeSlot } from "@/lib/types";
import { useProfile } from "@/store/account-store";
import { planActions } from "@/store/plan-store";

/**
 * Accepting an invite: send your budget / distance / timing so the group
 * average includes you, or skip it.
 */
export function JoinSheet({ open, plan, onClose }: { open: boolean; plan: PlanState; onClose: () => void }) {
  const prefs = useProfile().preferences;
  const [budget, setBudget] = useState(prefs.budget);
  const [distance, setDistance] = useState(prefs.distance);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(prefs.timeSlot);

  const join = (withPrefs: boolean) => {
    planActions.acceptInvite(plan.id, withPrefs ? { budget, distance, timeSlot } : null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Join "${plan.groupName}"`}>
      <p className="-mt-1 text-[12px] text-muted">
        Add your budget, distance and timing. Planzy averages everyone&apos;s to suggest places. You can skip this.
      </p>
      <h3 className="mt-4 text-[14px] font-semibold">Budget / person</h3>
      <div className="card mt-2">
        <RangeField
          label="Budget per person"
          value={budget}
          min={100}
          max={1000}
          step={50}
          marks={["₹500", "₹1000"]}
          format={(v) => `₹${v}`}
          onChange={setBudget}
        />
      </div>
      <h3 className="mt-4 text-[14px] font-semibold">Distance</h3>
      <div className="card mt-2">
        <RangeField
          label="Maximum distance"
          value={distance}
          min={2}
          max={25}
          step={1}
          marks={["10 km", "25 km"]}
          format={(v) => `${v} km`}
          tone="navy"
          onChange={setDistance}
        />
      </div>
      <h3 className="mt-4 text-[14px] font-semibold">Timing</h3>
      <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label="Time of day">
        {TIME_SLOTS.map((t) => (
          <Chip
            key={t}
            role="radio"
            aria-checked={timeSlot === t}
            selected={timeSlot === t}
            onClick={() => setTimeSlot(t)}
            className="!h-[36px] flex-1 !px-0 !text-[12px]"
          >
            {t}
          </Chip>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" size="md" onClick={() => join(false)} className="shrink-0">
          Skip
        </Button>
        <Button size="md" block onClick={() => join(true)}>
          Join group
        </Button>
      </div>
    </Sheet>
  );
}
