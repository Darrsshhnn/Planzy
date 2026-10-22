"use client";

import { Check, MessageCircle, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlanStep } from "@/components/plan/plan-step";
import { Avatar } from "@/components/ui/avatar";
import { FieldBox, FieldLabel } from "@/components/ui/card";
import { getFriends } from "@/lib/api/data";
import type { Friend } from "@/lib/types";
import { planActions, usePlan } from "@/store/plan-store";

const TOP_PICKS = 8;

export default function AddFriendsPage() {
  const router = useRouter();
  const plan = usePlan();
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const q = query.trim().toLowerCase();
  const friends = getFriends();
  const topPicks = friends.slice(0, TOP_PICKS);
  const others = friends.slice(TOP_PICKS);
  const results = friends.filter((f) => f.name.toLowerCase().includes(q));
  const selectedCount = plan.memberIds.length - 1;
  const isSelected = (id: string) => plan.memberIds.includes(id);

  const invite = async () => {
    const data = {
      title: "Join my Planzy plan",
      text: "Help us pick a place! Join my group on Planzy.",
      url: `${window.location.origin}/plan/start`,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(`${data.text} ${data.url}`);
      setToast("Invite link copied");
    } catch {
      setToast("Couldn't share right now");
    }
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <PlanStep
      backHref={plan.flow === "popular" ? "/plan/popular" : "/plan/start"}
      onContinue={() => router.push("/plan/group")}
      canContinue={selectedCount > 0}
      hint="Add at least one friend"
      continueLabel={selectedCount > 0 ? `Continue (${selectedCount})` : "Continue"}
      overlay={
        toast && (
          <div className="absolute inset-x-0 bottom-[110px] z-40 flex justify-center">
            <span className="rounded-full bg-ink px-4 py-2 text-[13px] text-white">{toast}</span>
          </div>
        )
      }
    >
      <FieldLabel>Add Friends</FieldLabel>
      <FieldBox className="mt-3 flex h-[48px] items-center gap-2 px-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search friends"
          aria-label="Search friends"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/40"
        />
        <Search size={24} />
      </FieldBox>

      {q ? (
        <>
          <h3 className="mt-5 font-heading text-[18px] font-bold">Results</h3>
          <FriendList friends={results} isSelected={isSelected} />
          {results.length === 0 && (
            <p className="py-4 text-center text-[13px] text-muted">
              No friends named &ldquo;{query}&rdquo;. Invite them instead.
            </p>
          )}
        </>
      ) : (
        <>
          <h3 className="mt-5 font-heading text-[18px] font-bold">Top Picks</h3>
          <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
            {topPicks.map((f) => {
              const selected = isSelected(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => planActions.toggleMember(f.id)}
                  aria-pressed={selected}
                  className="flex min-w-0 flex-col items-center gap-1"
                >
                  <span className="relative">
                    <Avatar
                      personId={f.id}
                      size={64}
                      className={selected ? "outline-[3px] outline-offset-2 outline-brand outline" : ""}
                    />
                    {selected && (
                      <span className="absolute -right-0.5 bottom-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-cream bg-brand text-white">
                        <Check size={14} />
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate text-[13px]">{f.name}</span>
                </button>
              );
            })}
          </div>

          <h3 className="mt-6 font-heading text-[18px] font-bold">More friends</h3>
          <FriendList friends={others} isSelected={isSelected} />
        </>
      )}

      <button
        onClick={invite}
        className="card mt-6 flex h-[48px] w-full items-center justify-center gap-2.5 text-[15px] font-semibold"
      >
        Invite People
        <MessageCircle size={22} className="text-[#3fb83f]" />
      </button>
    </PlanStep>
  );
}

/** Everyone beyond Top Picks (and search results): round avatar, name, Add / Added. */
function FriendList({ friends, isSelected }: { friends: Friend[]; isSelected: (id: string) => boolean }) {
  return (
    <ul className="mt-2 divide-y divide-ink/10">
      {friends.map((f) => {
        const selected = isSelected(f.id);
        return (
          <li key={f.id} className="flex items-center gap-3 py-2.5">
            <Avatar personId={f.id} size={44} />
            <span className="min-w-0 flex-1 truncate text-[15px]">{f.name}</span>
            <button
              onClick={() => planActions.toggleMember(f.id)}
              aria-pressed={selected}
              aria-label={`${selected ? "Remove" : "Add"} ${f.name}`}
              className={[
                "flex h-[32px] items-center gap-1 rounded-full border px-3.5 text-[12px] font-semibold transition",
                selected ? "border-brand bg-brand text-white" : "border-ink bg-paper text-ink",
              ].join(" ")}
            >
              {selected ? <Check size={14} /> : <Plus size={14} />}
              {selected ? "Added" : "Add"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
