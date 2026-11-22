"use client";

import { CalendarDays, Link2, LogOut, MapPin, Pencil, Plus, Shapes, Trash2, Trophy, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GroupFaces } from "@/components/ui/group-faces";
import { Sheet } from "@/components/ui/sheet";
import { getFriends, getPerson, getPlace } from "@/lib/api/data";
import { formatDateLong } from "@/lib/format";
import { groupPrefs } from "@/lib/group-prefs";
import type { MemberStatus } from "@/lib/types";
import { CURRENT_USER_ID, planActions, usePlan, usePlans } from "@/store/plan-store";

const DOT: Record<MemberStatus | "admin", string> = {
  admin: "bg-brand",
  accepted: "bg-[#1fa855]",
  invited: "bg-[#f5c400]",
  declined: "bg-[#d64545]",
};

const STATUS_LABEL: Record<MemberStatus | "admin", string> = {
  admin: "Admin",
  accepted: "Going",
  invited: "Invite sent",
  declined: "Can't make it",
};

/** Tapping the group name in a chat: a visual summary, people, and controls. */
export function GroupDetails({ planId }: { planId: string }) {
  const router = useRouter();
  const plan = usePlan();
  const { ready } = usePlans();
  const [adding, setAdding] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"delete" | "leave" | null>(null);
  const [toast, setToast] = useState("");

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
  const status = plan.archived
    ? "Completed"
    : plan.booking.status !== "none"
      ? "Booked"
      : plan.decided
        ? "Deciding"
        : "Voting";
  const created = new Date(plan.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  const facts = [
    { icon: CalendarDays, label: "When", value: `${formatDateLong(plan.date).replace(/,? \d{4}$/, "")} · ${g.timeSlot}` },
    { icon: Wallet, label: "Budget", value: `₹${g.budget} / person` },
    { icon: MapPin, label: "Distance", value: `Up to ${g.distance} km` },
    ...(plan.categories.length ? [{ icon: Shapes, label: "Type", value: plan.categories.join(", ") }] : []),
    ...(place ? [{ icon: Trophy, label: "Final pick", value: place.name }] : []),
  ];

  const shareLink = async () => {
    const url = `${window.location.origin}/chat/${plan.id}`;
    const data = { title: plan.groupName, text: `Join "${plan.groupName}" on Planzy`, url };
    try {
      if (navigator.share) return await navigator.share(data);
      await navigator.clipboard.writeText(`${data.text}: ${url}`);
      setToast("Group link copied");
    } catch {
      setToast("Couldn't share right now");
    }
    setTimeout(() => setToast(""), 2200);
  };

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
              {addable.length === 0 && (
                <li className="py-6 text-center text-[13px] text-muted">Everyone is already invited.</li>
              )}
            </ul>
          </Sheet>

          <Sheet open={!!removing} onClose={() => setRemoving(null)} title="Remove from group?">
            {removing && (
              <div className="flex flex-col items-center text-center">
                <Avatar personId={removing} size={72} />
                <p className="mt-3 text-[15px]">
                  Remove <span className="font-semibold">{getPerson(removing).name}</span> from {plan.groupName}?
                </p>
                <p className="mt-1 text-[12px] text-muted">Their votes are removed and the group is told.</p>
                <Button
                  block
                  className="mt-5"
                  onClick={() => {
                    planActions.removeMember(removing);
                    setRemoving(null);
                  }}
                >
                  Remove {getPerson(removing).name}
                </Button>
                <button onClick={() => setRemoving(null)} className="mt-3 py-2 text-[14px] font-semibold text-ink/70">
                  Cancel
                </button>
              </div>
            )}
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
            <Button
              block
              className="mt-5"
              onClick={() => {
                if (confirm === "delete") planActions.deletePlan(plan.id);
                else planActions.leavePlan(plan.id);
                router.replace("/chat");
              }}
            >
              {confirm === "delete" ? "Delete plan" : "Leave plan"}
            </Button>
            <button onClick={() => setConfirm(null)} className="mt-3 w-full py-2 text-[14px] font-semibold text-ink/70">
              Cancel
            </button>
          </Sheet>

          {toast && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[120px] z-40 flex justify-center">
              <span className="rounded-full bg-ink px-4 py-2 text-[13px] text-white">{toast}</span>
            </div>
          )}
        </>
      }
    >
      <PageHeader title="Group details" backHref={`/chat/${plan.id}`} />

      {/* Card 1: the plan at a glance */}
      <section className="reveal card p-5">
        <div className="flex items-center gap-4">
          <GroupFaces ids={plan.memberIds} size={64} />
          <div className="min-w-0 flex-1">
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
                  className="h-10 min-w-0 flex-1 rounded-[10px] border border-ink bg-white px-3 text-[15px] outline-none focus:border-brand"
                />
                <Button size="sm" type="submit" variant="brand">
                  Save
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <h2 className="truncate font-heading text-[20px] font-bold leading-tight">{plan.groupName}</h2>
                {editable && (
                  <button
                    onClick={() => {
                      setName(plan.groupName);
                      setEditingName(true);
                    }}
                    aria-label="Rename group"
                    className="shrink-0 rounded-full p-1.5 text-ink/60 hover:bg-ink/5"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            )}
            <p className="mt-1 flex items-center gap-2 text-[12px] text-muted">
              <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-ink">{status}</span>
              {plan.memberIds.length} going
            </p>
          </div>
        </div>

        <dl className="mt-5 divide-y divide-ink/10 border-t border-ink/10">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-3">
              <Icon size={17} className="shrink-0 text-brand" />
              <dt className="text-[13px] text-muted">{label}</dt>
              <dd className="ml-auto truncate pl-3 text-right text-[14px] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-1 text-[11px] text-muted">
          Created {created} by {plan.adminId === CURRENT_USER_ID ? "you" : getPerson(plan.adminId).name}
        </p>
      </section>

      {/* Card 2: people */}
      <section className="reveal card mt-5 overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h3 className="font-heading text-[16px] font-bold">People</h3>
          <span className="text-[12px] text-muted">{people.length}</span>
        </div>
        <ul className="divide-y divide-ink/10">
          {people.map((id) => {
            const st = id === plan.adminId ? "admin" : plan.invites[id];
            const canRemove = editable && id !== plan.adminId;
            return (
              <li key={id} className="flex items-center gap-3 px-5 py-3">
                <Avatar personId={id} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">
                    {id === CURRENT_USER_ID ? "You" : getPerson(id).name}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-muted">
                    <span className={`h-2 w-2 rounded-full ${DOT[st]}`} />
                    {STATUS_LABEL[st]}
                  </span>
                </span>
                {canRemove && (
                  <button
                    onClick={() => setRemoving(id)}
                    aria-label={`Remove ${getPerson(id).name}`}
                    className="rounded-full px-2.5 py-1 text-[12px] font-medium text-ink/60 hover:bg-ink/5"
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
          {editable && (
            <li>
              <button
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-[14px] font-semibold text-brand"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-brand">
                  <Plus size={18} />
                </span>
                Add people
              </button>
            </li>
          )}
        </ul>
      </section>

      <div className="mt-7 space-y-1">
        {!plan.archived && (
          <button
            onClick={shareLink}
            className="flex w-full items-center justify-center gap-2 py-3 text-[14px] font-semibold text-ink"
          >
            <Link2 size={17} /> Share group link
          </button>
        )}
        <button
          onClick={() => setConfirm(isAdmin ? "delete" : "leave")}
          className="flex w-full items-center justify-center gap-2 py-3 text-[14px] font-semibold text-[#b42318]"
        >
          {isAdmin ? <Trash2 size={17} /> : <LogOut size={17} />} {isAdmin ? "Delete plan" : "Leave plan"}
        </button>
      </div>
    </Screen>
  );
}
