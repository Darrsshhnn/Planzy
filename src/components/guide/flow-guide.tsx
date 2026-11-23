"use client";

import { Lightbulb, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { setGuide, useGuideActive } from "@/store/account-store";
import { usePlans } from "@/store/plan-store";

interface GuideStep {
  id: string;
  match: (path: string) => boolean;
  title: string;
  body: string;
}

/** The main flow, in order: create a plan → invite → decide together → book. */
const STEPS: GuideStep[] = [
  {
    id: "home",
    match: (p) => p === "/",
    title: "Make your first plan",
    body: "Tap the orange + in the bar below to start a plan. Not sure where to go? tap Scout on this screen.",
  },
  {
    id: "friends",
    match: (p) => p === "/plan/friends",
    title: "Invite your friends",
    body: "Tap Add next to the friends you want along, then Invite & continue. Each one gets an invite to accept.",
  },
  {
    id: "group",
    match: (p) => p === "/plan/group",
    title: "Name the group",
    body: "Give the group a name, pick the day and what kind of outing it is.",
  },
  {
    id: "prefs",
    match: (p) => p === "/plan/preferences",
    title: "Set preferences",
    body: "Budget, distance and timing. Friends' answers are averaged in so the picks suit everyone. You can skip this.",
  },
  {
    id: "recs",
    match: (p) => p === "/plan/recommendations",
    title: "Shortlist places",
    body: "Tap the places you like to add them to the shortlist, then create the group. Friends can add more in the chat.",
  },
  {
    id: "chat",
    match: (p) => /^\/chat\/(?!dm\/)[^/]+$/.test(p),
    title: "Vote together",
    body: "Everyone votes In, Maybe or Can't on each place. As the admin, tap Decide once the votes are in.",
  },
  {
    id: "decision",
    match: (p) => p === "/decision",
    title: "Make the final call",
    body: "Compare the top places side by side. Pick one and lock it in for the group.",
  },
  {
    id: "booking",
    match: (p) => p.startsWith("/booking"),
    title: "Book it",
    body: "Choose a slot and pay for the group, or pay at the venue. Members see the booking as soon as it's done.",
  },
  {
    id: "locked",
    match: (p) => p === "/locked",
    title: "You're all set!",
    body: "Your first plan is locked in and everyone's been told. That's the whole flow: plan, vote, decide, book.",
  },
];

/**
 * First-plan walkthrough for new users. A coach card at the top of each step
 * of the main flow says what to do there. It can be folded into a small
 * button, skipped, or finished on the Locked In screen.
 */
export function FlowGuide() {
  const active = useGuideActive();
  const path = usePathname();
  const { plans } = usePlans();
  const [folded, setFolded] = useState<string | null>(null);

  const index = STEPS.findIndex((s) => s.match(path));
  if (!active || index < 0) return null;
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  // Back on Home with a plan already going: point at it instead of +.
  const going = plans.some((p) => p.created && !p.archived && !p.id.startsWith("old-") && !p.id.startsWith("inv-"));
  const body =
    step.id === "home" && going
      ? "Your plan is under way. Tap its card at the top to get back to the group chat and keep going."
      : step.body;

  if (folded === step.id) {
    return (
      <button
        type="button"
        onClick={() => setFolded(null)}
        aria-label={`Show guide, step ${index + 1} of ${STEPS.length}`}
        className="animate-pop absolute right-3 top-[38%] z-40 flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-[0_3px_0_#242a2f]"
      >
        <Lightbulb size={18} />
        <span className="text-[9px] font-bold leading-none">
          {index + 1}/{STEPS.length}
        </span>
      </button>
    );
  }

  return (
    <aside
      key={step.id}
      role="status"
      aria-label="First plan guide"
      className="animate-rise-down card-dark absolute inset-x-3 top-2 z-40 p-3.5 text-white shadow-[0_12px_30px_-10px_rgba(36,42,47,0.6)]"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand">
          <Lightbulb size={15} />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">
          Your first plan · Step {index + 1} of {STEPS.length}
        </p>
        <button
          type="button"
          onClick={() => setFolded(step.id)}
          aria-label="Hide guide for now"
          className="-mr-1 ml-auto flex h-7 w-7 items-center justify-center rounded-full text-cream/80 hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>
      <h2 className="mt-1.5 font-heading text-[17px] font-bold">{step.title}</h2>
      <p className="mt-0.5 text-[12px] leading-[17px] text-white/80">{body}</p>
      <div className="mt-2.5 flex items-center gap-1" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s.id} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-brand" : "bg-white/20"}`} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        {last ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={() => setGuide("done")}
            className="text-[12px] text-white/70 underline underline-offset-2"
          >
            Skip guide
          </button>
        )}
        <button
          type="button"
          onClick={() => (last ? setGuide("done") : setFolded(step.id))}
          className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-semibold text-white shadow-[0_2px_0_#c95e12] active:translate-y-px active:shadow-none"
        >
          {last ? "Finish guide" : "Got it"}
        </button>
      </div>
    </aside>
  );
}
