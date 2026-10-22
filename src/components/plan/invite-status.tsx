"use client";

import { Check, Clock, X } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { getPerson } from "@/lib/api/data";
import type { MemberStatus, PlanState } from "@/lib/types";

const STATUS: Record<MemberStatus, { label: string; className: string; icon: ReactNode }> = {
  invited: { label: "Waiting", className: "bg-[#FFF3DC] text-[#a2610a]", icon: <Clock size={12} /> },
  accepted: { label: "Accepted", className: "bg-[#E3F7EA] text-[#1a7f45]", icon: <Check size={12} /> },
  declined: { label: "Declined", className: "bg-[#FDE7E7] text-[#b42318]", icon: <X size={12} /> },
};

export function StatusPill({ status }: { status: MemberStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.className}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

/** Everyone the admin invited, with their live reply. */
export function InviteStatusList({
  plan,
  trailing,
}: {
  plan: PlanState;
  /** Extra control per person (e.g. Remove on the group details screen). */
  trailing?: (id: string) => ReactNode;
}) {
  const ids = Object.keys(plan.invites);
  if (!ids.length) return <p className="mt-2 text-[13px] text-muted">Nobody invited yet.</p>;
  return (
    <ul className="mt-2 divide-y divide-ink/10">
      {ids.map((id) => (
        <li key={id} className="flex items-center gap-3 py-2">
          <Avatar personId={id} size={36} />
          <span className="min-w-0 flex-1 truncate text-[14px]">{getPerson(id).name}</span>
          <StatusPill status={plan.invites[id]} />
          {trailing?.(id)}
        </li>
      ))}
    </ul>
  );
}
