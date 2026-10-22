"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { AvatarStack } from "@/components/ui/avatar";
import { getGroups, getPerson } from "@/lib/api/data";
import { joinNames } from "@/lib/format";
import { CURRENT_USER_ID, planActions, usePlans } from "@/store/plan-store";

/** Saved friend groups (start a plan with one tap) and the group chats you're in. */
export default function GroupsPage() {
  const router = useRouter();
  const { plans } = usePlans();
  const active = plans.filter((p) => p.created && !p.archived && p.memberIds.includes(CURRENT_USER_ID));

  return (
    <Screen>
      <PageHeader title="Groups" backHref="/profile" />

      <h2 className="font-heading text-[16px] font-bold">Saved groups</h2>
      <p className="text-[12px] text-muted">Tap one to start a plan with those friends.</p>
      <ul className="mt-2 space-y-2.5">
        {getGroups().map((g) => (
          <li key={g.id}>
            <button
              onClick={() => {
                planActions.start("new", g.memberIds);
                router.push("/plan/friends");
              }}
              className="card flex w-full items-center gap-3 bg-cream! p-2.5 text-left"
            >
              <Image src={g.image} alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-full border border-ink" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{g.name}</span>
                <span className="block truncate text-[12px] text-muted">
                  {joinNames(g.memberIds.map((id) => getPerson(id).name))}
                </span>
              </span>
              <span className="text-[12px] font-semibold text-brand">Plan</span>
            </button>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 font-heading text-[16px] font-bold">Your group chats</h2>
      <ul className="mt-2 space-y-2.5">
        {active.map((p) => (
          <li key={p.id}>
            <Link href={`/chat/${p.id}/details`} className="card flex items-center gap-3 p-3">
              <AvatarStack ids={p.memberIds} size={30} max={3} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{p.groupName}</span>
                <span className="block text-[12px] text-muted">
                  {p.memberIds.length} members{p.adminId === CURRENT_USER_ID ? " · you're the admin" : ""}
                </span>
              </span>
              <ChevronRight size={18} className="text-ink/50" />
            </Link>
          </li>
        ))}
        {active.length === 0 && <li className="text-[13px] text-muted">No running group chats.</li>}
      </ul>
    </Screen>
  );
}
