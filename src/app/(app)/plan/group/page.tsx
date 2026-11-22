"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanStep } from "@/components/plan/plan-step";
import { InviteStatusList } from "@/components/plan/invite-status";
import { FieldBox, FieldLabel } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { DatePicker } from "@/components/ui/date-picker";
import { CATEGORIES } from "@/lib/api/data";
import { defaultGroupName, planActions, usePlan } from "@/store/plan-store";

export default function GroupDetailsPage() {
  const router = useRouter();
  const plan = usePlan();
  const ready = plan.categories.length > 0 && !!plan.date;

  return (
    <PlanStep
      backHref="/plan/friends"
      onContinue={() => router.push("/plan/preferences")}
      canContinue={ready}
      hint="Pick at least one category and a date"
    >
      <FieldLabel>Name Group</FieldLabel>
      <FieldBox className="mt-3 flex h-[48px] items-center gap-2 px-4">
        <input
          value={plan.groupName}
          onChange={(e) => planActions.setGroupName(e.target.value)}
          placeholder={defaultGroupName(Object.keys(plan.invites))}
          aria-label="Group name"
          maxLength={40}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/35"
        />
      </FieldBox>

      <div className="mt-5 flex items-center justify-between">
        <h3 className="font-heading text-[16px] font-bold">Invited friends</h3>
        <Link
          href="/plan/friends"
          aria-label="Invite more friends"
          className="flex h-8 items-center gap-1 rounded-full border border-ink bg-paper px-3 text-[12px] font-semibold"
        >
          <Plus size={14} /> Add
        </Link>
      </div>
      <p className="text-[11px] text-muted">They get a notification and can accept or decline.</p>
      <InviteStatusList plan={plan} />

      <h3 className="mt-5 font-heading text-[16px] font-bold">Categories</h3>
      <div className="mt-2.5 flex flex-wrap gap-x-2.5 gap-y-2.5">
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={plan.categories.includes(c)} onClick={() => planActions.toggleCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <h3 className="mt-5 font-heading text-[16px] font-bold">Date</h3>
      <DatePicker value={plan.date} onChange={planActions.setDate} />
    </PlanStep>
  );
}
