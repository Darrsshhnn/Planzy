"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/ui/card";

/** Shared frame for every "Make a Plan" step: header, cream card, Continue. */
export function PlanStep({
  backHref,
  children,
  onContinue,
  canContinue = true,
  hint,
  continueLabel = "Continue",
  title = "Make a Plan",
  cardClassName = "",
  overlay,
}: {
  backHref: string;
  children: ReactNode;
  onContinue: () => void;
  canContinue?: boolean;
  hint?: string;
  continueLabel?: string;
  title?: string;
  cardClassName?: string;
  overlay?: ReactNode;
}) {
  return (
    <Screen overlay={overlay}>
      <PageHeader title={title} backHref={backHref} />
      <PlanCard className={cardClassName}>{children}</PlanCard>
      <div className="mt-5 px-1.5">
        <Button block onClick={onContinue} disabled={!canContinue}>
          {continueLabel}
        </Button>
        {!canContinue && hint && <p className="mt-2 text-center text-[12px] text-muted">{hint}</p>}
      </div>
    </Screen>
  );
}
