"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { StickyFooter } from "@/components/layout/sticky-footer";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/ui/card";

/**
 * Shared frame for every "Make a Plan" step: header, cream card, and a
 * Continue button pinned above the navigation with a blur under it.
 */
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
  onSkip,
  skipLabel = "Skip",
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
  onSkip?: () => void;
  skipLabel?: string;
}) {
  return (
    <Screen
      withFooter
      overlay={
        <>
          <StickyFooter>
            <Button block onClick={onContinue} disabled={!canContinue}>
              {continueLabel}
            </Button>
            {!canContinue && hint && <p className="mt-1.5 text-center text-[12px] text-ink/70">{hint}</p>}
          </StickyFooter>
          {overlay}
        </>
      }
    >
      <PageHeader
        title={title}
        backHref={backHref}
        right={
          onSkip && (
            <button
              onClick={onSkip}
              className="rounded-full px-3 py-1.5 text-[14px] font-semibold text-brand hover:bg-cream"
            >
              {skipLabel}
            </button>
          )
        }
      />
      <PlanCard className={`reveal ${cardClassName}`}>{children}</PlanCard>
    </Screen>
  );
}
