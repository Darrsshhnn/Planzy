"use client";

import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { PlanStep } from "@/components/plan/plan-step";
import { InviteStatusList } from "@/components/plan/invite-status";
import { FieldBox, FieldLabel } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { CATEGORIES } from "@/lib/api/data";
import { formatDateShort } from "@/lib/format";
import { defaultGroupName, planActions, usePlan } from "@/store/plan-store";

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function GroupDetailsPage() {
  const router = useRouter();
  const plan = usePlan();
  const dateRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = dateRef.current;
    if (!el) return;
    el.min = todayIso();
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

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
      <FieldBox className="relative mt-2.5 flex h-[48px] items-center px-4">
        <span className={`flex-1 text-[17px] font-semibold ${plan.date ? "text-ink" : "text-ink/35"}`}>
          {plan.date ? formatDateShort(plan.date) : "01/01/2025"}
        </span>
        <CalendarDays size={24} />
        <input
          ref={dateRef}
          type="date"
          aria-label="Outing date"
          value={plan.date}
          onChange={(e) => planActions.setDate(e.target.value)}
          onClick={openPicker}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </FieldBox>
    </PlanStep>
  );
}
