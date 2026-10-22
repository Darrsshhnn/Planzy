"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlanStep } from "@/components/plan/plan-step";
import type { PlanFlow } from "@/lib/types";
import { planActions, usePlan } from "@/store/plan-store";

const OPTIONS: { flow: PlanFlow; title: string; body: string }[] = [
  {
    flow: "new",
    title: "New Group outing",
    body: "Invite friends, set budget and timing, and discover curated matches.",
  },
  {
    flow: "popular",
    title: "Popular Places",
    body: "Pick a popular place upfront as per your previous experiences",
  },
];

export default function StartPlanPage() {
  const router = useRouter();
  const plan = usePlan();
  const [choice, setChoice] = useState<PlanFlow | null>(null);
  const selected = choice ?? plan.flow;
  const hasActiveChat = plan.messages.length > 0;

  const onContinue = () => {
    if (!selected) return;
    if (hasActiveChat || plan.flow === null) {
      // Keep friends picked from a saved group; drop everything else.
      planActions.start(selected, hasActiveChat ? [] : plan.memberIds);
    } else {
      planActions.setFlow(selected);
    }
    router.push(selected === "popular" ? "/plan/popular" : "/plan/friends");
  };

  return (
    <PlanStep
      backHref="/"
      onContinue={onContinue}
      canContinue={!!selected}
      hint="Choose how you want to start"
      cardClassName="min-h-[470px]"
    >
      <h2 className="font-heading text-[20px] font-bold">Start a</h2>
      <div className="mt-5 space-y-8" role="radiogroup" aria-label="Plan type">
        {OPTIONS.map((o) => {
          const active = selected === o.flow;
          return (
            <button
              key={o.flow}
              role="radio"
              aria-checked={active}
              onClick={() => setChoice(o.flow)}
              className={[
                "card flex w-full items-center gap-3 px-5 py-4 text-left transition",
                active ? "border-brand! ring-2 ring-brand/60" : "",
              ].join(" ")}
            >
              <div className="flex-1">
                <h3 className="font-heading text-[18px] font-bold">{o.title}</h3>
                <p className="mt-1.5 text-[13px] leading-[19px] text-ink/90">{o.body}</p>
              </div>
              <span
                className={[
                  "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2",
                  active ? "border-brand bg-white" : "border-[#8f8f8f] bg-[#a3a3a3]",
                ].join(" ")}
              >
                {active && <span className="h-[16px] w-[16px] rounded-full bg-brand" />}
              </span>
            </button>
          );
        })}
      </div>

      {hasActiveChat && (
        <div className="mt-8 rounded-[12px] border border-dashed border-ink/40 bg-paper p-4 text-[13px]">
          <p>
            You already have an active plan, <span className="font-semibold">{plan.groupName}</span>. Continuing
            here starts a new one.
          </p>
          <Link href="/chat" className="mt-2 inline-block font-semibold text-brand underline underline-offset-2">
            Go to active plan
          </Link>
        </div>
      )}
    </PlanStep>
  );
}
