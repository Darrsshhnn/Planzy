"use client";

import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { PlanStep } from "@/components/plan/plan-step";
import { AvatarStack } from "@/components/ui/avatar";
import { FieldBox, FieldLabel } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { CATEGORIES, getPerson } from "@/lib/api/data";
import { formatDateShort, joinNames } from "@/lib/format";
import { defaultGroupName, planActions, usePlan } from "@/store/plan-store";

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function GroupDetailsPage() {
  const router = useRouter();
  const plan = usePlan();
  const dateRef = useRef<HTMLInputElement>(null);
  const friendIds = plan.memberIds.filter((id) => id !== plan.adminId);

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
          placeholder={defaultGroupName(plan.memberIds)}
          aria-label="Group name"
          maxLength={40}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/35"
        />
      </FieldBox>

      <h3 className="mt-5 font-heading text-[18px] font-bold">Selected Partners</h3>
      <div className="mt-2.5 flex items-center gap-2">
        <AvatarStack ids={friendIds} size={50} max={5} />
        <Link
          href="/plan/friends"
          aria-label="Add more friends"
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full border-[1.5px] border-ink"
        >
          <Plus size={26} />
        </Link>
      </div>
      <p className="mt-1.5 text-[14px]">{joinNames(friendIds.map((id) => getPerson(id).name))}</p>

      <h3 className="mt-5 font-heading text-[18px] font-bold">Categories</h3>
      <div className="mt-2.5 flex flex-wrap gap-x-2.5 gap-y-2.5">
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={plan.categories.includes(c)} onClick={() => planActions.toggleCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <h3 className="mt-5 font-heading text-[18px] font-bold">Date</h3>
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
