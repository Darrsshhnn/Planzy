"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { GroupFaces } from "@/components/ui/group-faces";
import { getGroups } from "@/lib/api/data";
import { useIsNewUser } from "@/store/account-store";
import { planActions } from "@/store/plan-store";

/** Saved groups: tapping one starts a new plan with those friends preselected. */
export function GroupsRow() {
  const router = useRouter();
  // New accounts have no saved groups yet: just the button to make one.
  const groups = useIsNewUser() ? [] : getGroups();
  const startWith = (memberIds: string[]) => {
    planActions.start("new", memberIds);
    router.push("/plan/friends");
  };
  return (
    <div className="carousel items-start">
      {groups.map((g) => (
        <button
          key={g.id}
          onClick={() => startWith(g.memberIds)}
          aria-label={`Plan with ${g.name}`}
          className="reveal-x flex w-[100px] shrink-0 flex-col items-center gap-1.5 transition active:scale-95"
        >
          <GroupFaces ids={g.memberIds} size={96} />
          <span className="w-full truncate text-center text-[12px] font-semibold">{g.name}</span>
        </button>
      ))}
      {groups.length === 0 && (
        <button
          onClick={() => startWith([])}
          className="card flex h-[96px] flex-1 items-center gap-3 bg-cream! px-4 text-left"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Plus size={22} />
          </span>
          <span>
            <span className="block text-[14px] font-semibold">Start your first group</span>
            <span className="block text-[12px] text-muted">Pick friends and plan an outing together</span>
          </span>
        </button>
      )}
      <button
        onClick={() => startWith([])}
        aria-label="Create a new group"
        hidden={groups.length === 0}
        className="flex h-[96px] w-[56px] shrink-0 items-center justify-center rounded-[16px] border-2 border-dashed border-brand bg-cream text-ink transition active:scale-95"
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
