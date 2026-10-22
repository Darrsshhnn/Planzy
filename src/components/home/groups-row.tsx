"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getGroups } from "@/lib/api/data";
import { planActions } from "@/store/plan-store";

/** Saved groups: tapping one starts a new plan with those friends preselected. */
export function GroupsRow() {
  const router = useRouter();
  const startWith = (memberIds: string[]) => {
    planActions.start("new", memberIds);
    router.push("/plan/start");
  };
  return (
    <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto px-5 pb-1">
      {getGroups().map((g) => (
        <button
          key={g.id}
          onClick={() => startWith(g.memberIds)}
          aria-label={`Plan with ${g.name}`}
          className="shrink-0 rounded-full transition active:scale-95"
        >
          <Image
            src={g.image}
            alt={g.name}
            width={100}
            height={100}
            className="h-[100px] w-[100px] rounded-full border-2 border-ink object-cover"
          />
        </button>
      ))}
      <button
        onClick={() => startWith([])}
        aria-label="Create a new group"
        className="flex h-[98px] w-[50px] shrink-0 items-center justify-center rounded-[8px] border-2 border-brand bg-cream text-ink transition active:scale-95"
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
