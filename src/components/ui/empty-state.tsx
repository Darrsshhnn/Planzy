import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 pt-16 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-ink bg-cream">
        <Icon size={28} className="text-brand" />
      </span>
      <h2 className="font-heading text-[20px] font-bold">{title}</h2>
      <p className="mt-2 text-[14px] text-muted">{body}</p>
      {action && <div className="mt-6 w-full">{action}</div>}
    </div>
  );
}
