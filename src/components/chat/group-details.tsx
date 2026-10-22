"use client";

import { CalendarDays, Clock, Crown, LogOut, Pencil, Plus, Trash2, UserMinus, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { StatusPill } from "@/components/plan/invite-status";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { getFriends, getPerson, getPlace } from "@/lib/api/data";
import { formatDateLong } from "@/lib/format";
import { groupPrefs } from "@/lib/group-prefs";
import { CURRENT_USER_ID, planActions, usePlan, usePlans } from "@/store/plan-store";

/** Tapping the group name in a chat: who's in it, details, and admin controls. */
export function GroupDetails({ planId }: { planId: string }) {
  const router = useRouter();
  const plan = usePlan();
  const { ready } = usePlans();
  const [adding, setAdding] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState<"delete" | "leave" | null>(null);

  useLayoutEffect(() => {
    planActions.select(planId);
  }, [planId]);

  if (plan.id !== planId) {
    return ready ? (
      <Screen>
        <PageHeader title="Group details" backHref="/chat" />
        <p className="mt-10 text-center text-[14px] text-muted">This group doesn&apos;t exist anymore.</p>
      </Screen>
    ) : null;
  }

  const isAdmin = plan.adminId === CURRENT_USER_ID;
  const editable = isAdmin && !plan.archived;
  const g = groupPrefs(plan);
  const place = getPlace(plan.chosenPlaceId);
  const people = [plan.adminId, ...Object.keys(plan.invites).filter((id) => id !== plan.adminId)];
  const addable = getFriends().filter((f) => !plan.invites[f.id] && f.id !== plan.adminId);

  const created = new Date(plan.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const details: { icon: typeof Clock; label: string; value: string }[] = [
    { icon: Clock, label: "Created", value: `${created} by ${getPerson(plan.adminId).name}` },
    { icon: CalendarDays, label: "Outing date", value: `${formatDateLong(plan.date)} · ${g.timeSlot}` },
    { icon: Wallet, label: "Group budget", value: `~₹${g.budget} per person · within ${g.distance} km` },
    { icon: Users, label: "Categories", value: plan.categories.join(", ") || "Any" },
  ];

  return (
    <Screen
      overlay={
        <>
          <Sheet open={adding} onClose={() => setAdding(false)} title="Add people">
            <p className="-mt-1 mb-2 text-[12px] text-muted">They get an invite and can accept or decline.</p>
            <ul className="divide-y divide-ink/10">
              {addable.map((f) => (
                <li key={f.id} className="flex items-center gap-3 py-2.5">
                  <Avatar personId={f.id} size={40} />
                  <span className="min-w-0 flex-1 truncate text-[14px]">{f.name}</span>
                  <Button size="sm" onClick={() => planActions.addMember(f.id)}>
                    <Plus size={14} /> Invite
                  </Button>
                </li>
              ))}
              {addable.length === 0 && <li className="py-6 text-center text-[13px] text-muted">Everyone is already invited.</li>}
            </ul>
          </Sheet>
          <Sheet
            open={!!confirm}
            onClose={() => setConfirm(null)}
            title={confirm === "delete" ? "Delete this plan?" : "Leave this plan?"}
          >
            <p className="text-[14px]">
              {confirm === "delete"
                ? "The group chat, votes and booking details will be removed for everyone."
                : "You'll stop getting messages and the chat moves out of your list."}
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" size="md" block onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                size="md"
                block
                className="bg-[#b42318]! shadow-[0_3px_0_#242a2f]!"
                onClick={() => {
                  if (confirm === "delete") planActions.deletePlan(plan.id);
                  else planActions.leavePlan(plan.id);
                  router.replace("/chat");
                }}
              >
                {confirm === "delete" ? "Delete plan" : "Leave plan"}
              </Button>
            </div>
          </Sheet>
        </>
      }
    >
      <PageHeader title="Group details" backHref={`/chat/${plan.id}`} />

      <section className="card bg-cream! p-4">
        {editingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) planActions.setGroupName(name.trim());
              setEditingName(false);
            }}
            className="flex gap-2"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              aria-label="Group name"
              className="h-10 min-w-0 flex-1 rounded-[10px] border border-ink bg-paper px-3 text-[15px] outline-none"
            />
            <Button size="sm" type="submit">
              Save
            </Button>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Group name</p>
              <h2 className="font-heading text-[20px] font-bold leading-tight">{plan.groupName}</h2>
            </div>
            {editable && (
              <button
                onClick={() => {
                  setName(plan.groupName);
                  setEditingName(true);
                }}
                aria-label="Rename group"
                className="rounded-full p-2 hover:bg-white"
              >
                <Pencil size={18} />
              </button>
            )}
          </div>
        )}
        {place && (
          <p className="mt-2 text-[13px]">
            Final pick: <span className="font-semibold">{place.name}</span>
          </p>
        )}
      </section>

      <div className="mt-5 flex items-center justify-between">
        <h3 className="font-heading text-[16px] font-bold">People ({people.length})</h3>
        {editable && (
          <button
            onClick={() => setAdding(true)}
            className="flex h-8 items-center gap-1 rounded-full border border-ink bg-paper px-3 text-[12px] font-semibold"
          >
            <Plus size={14} /> Add people
          </button>
        )}
      </div>
      <ul className="card mt-2 divide-y divide-ink/10 px-3">
        {people.map((id) => (
          <li key={id} className="flex items-center gap-3 py-2.5">
            <Avatar personId={id} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">
                {getPerson(id).name}
                {id === CURRENT_USER_ID && " (you)"}
              </p>
              {plan.memberPrefs[id] && (
                <p className="text-[11px] text-muted">
                  ₹{plan.memberPrefs[id]!.budget} · {plan.memberPrefs[id]!.distance} km · {plan.memberPrefs[id]!.timeSlot}
                </p>
              )}
            </div>
            {id === plan.adminId ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-brand">
                <Crown size={12} /> Admin
              </span>
            ) : (
              <StatusPill status={plan.invites[id]} />
            )}
            {editable && id !== plan.adminId && (
              <button
                onClick={() => planActions.removeMember(id)}
                aria-label={`Remove ${getPerson(id).name}`}
                className="rounded-full p-1.5 text-ink/60 hover:bg-cream hover:text-[#b42318]"
              >
                <UserMinus size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <h3 className="mt-5 font-heading text-[16px] font-bold">Details</h3>
      <dl className="card mt-2 space-y-3 p-3.5">
        {details.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon size={18} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <dt className="text-[11px] text-muted">{label}</dt>
              <dd className="text-[13px] font-medium">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        {isAdmin ? (
          <Button block variant="outline" className="text-[#b42318]! border-[#b42318]!" onClick={() => setConfirm("delete")}>
            <Trash2 size={18} /> Delete plan
          </Button>
        ) : (
          <Button block variant="outline" className="text-[#b42318]! border-[#b42318]!" onClick={() => setConfirm("leave")}>
            <LogOut size={18} /> Leave plan
          </Button>
        )}
      </div>
    </Screen>
  );
}
