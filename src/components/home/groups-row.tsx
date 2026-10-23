"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { GroupFaces } from "@/components/ui/group-faces";
import { getGroups } from "@/lib/api/data";
import { planActions } from "@/store/plan-store";

/** Saved groups: tapping one starts a new plan with those friends preselected. */
export function GroupsRow() {
  const router = useRouter();
  const startWith = (memberIds: string[]) => {
    planActions.start("new", memberIds);
    router.push("/plan/friends");
  };
  return (
    <div className="carousel items-start">
      {getGroups().map((g) => (
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
      <button
        onClick={() => startWith([])}
        aria-label="Create a new group"
        className="flex h-[96px] w-[56px] shrink-0 items-center justify-center rounded-[16px] border-2 border-dashed border-brand bg-cream text-ink transition active:scale-95"
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
