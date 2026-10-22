import type { ComponentProps, ReactNode } from "react";

/** The cream, ink-bordered panel used on every "Make a Plan" step. */
export function PlanCard({ className = "", ...rest }: ComponentProps<"section">) {
  return (
    <section
      className={`card bg-cream! px-5 pb-5 pt-4 ${className}`}
      {...rest}
    />
  );
}

/** White inset box inside a PlanCard (inputs, sliders, list rows). */
export function FieldBox({ className = "", ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-[12px] border border-ink bg-paper shadow-[0_2px_0_#242a2f] ${className}`}
      {...rest}
    />
  );
}

export function FieldLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-heading text-[17px] font-bold text-ink ${className}`}>{children}</h2>;
}

/** Section heading on the Home screen ("Recents", "Recommendation", ...). */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5">
      <h2 className="font-heading text-[19px] font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}
