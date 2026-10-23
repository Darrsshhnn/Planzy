"use client";

import { CalendarDays, Crown, Link2, LogOut, MapPin, Pencil, Plus, Tag, Trash2, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceImage } from "@/components/place/place-image";
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

  const stats = [
    { icon: CalendarDays, value: formatDateLong(plan.date).replace(/,? \d{4}$/, ""), label: g.timeSlot },
    { icon: Users, value: String(plan.memberIds.length), label: "going" },
    { icon: Wallet, value: `₹${g.budget}`, label: "per person" },
    { icon: MapPin, value: `${g.distance} km`, label: "max" },
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

      {/* Hero: faces, name, status */}
      <section className="reveal card-dark relative overflow-hidden px-4 pb-5 pt-6 text-center text-white">
        <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/25" aria-hidden />
        <span className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-navy/50" aria-hidden />
        <div className="relative flex justify-center">
          <GroupFaces ids={plan.memberIds} size={92} className="border-cream!" />
        </div>
        {editingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) planActions.setGroupName(name.trim());
              setEditingName(false);
            }}
            className="relative mt-3 flex gap-2"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              aria-label="Group name"
              className="h-10 min-w-0 flex-1 rounded-[10px] border border-cream bg-white px-3 text-[15px] text-ink outline-none"
            />
            <Button size="sm" type="submit" variant="brand">
              Save
            </Button>
          </form>
        ) : (
          <div className="relative mt-3 flex items-center justify-center gap-1.5">
            <h2 className="font-heading text-[22px] font-bold leading-tight">{plan.groupName}</h2>
            {editable && (
              <button
                onClick={() => {
                  setName(plan.groupName);
                  setEditingName(true);
                }}
                aria-label="Rename group"
                className="rounded-full p-1.5 text-cream hover:bg-white/10"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
        )}
        <span className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-semibold text-ink">
          <Tag size={11} /> {status}
        </span>
      </section>

      {/* Key facts as icon tiles */}
      <section className="reveal mt-3 grid grid-cols-4 gap-2">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="card flex flex-col items-center px-1 py-2.5 text-center">
            <Icon size={18} className="text-brand" />
            <span className="mt-1 text-[13px] font-bold leading-tight">{value}</span>
            <span className="text-[10px] text-muted">{label}</span>
          </div>
        ))}
      </section>
      <p className="mt-2 text-center text-[11px] text-muted">
        Created {created} by {getPerson(plan.adminId).name}
        {plan.categories.length > 0 && ` · ${plan.categories.join(", ")}`}
      </p>

      {place && (
        <div className="reveal card mt-3 flex items-center gap-3 p-2.5">
          <PlaceImage place={place} className="h-[48px] w-[56px] shrink-0 rounded-[8px]" sizes="56px" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">Final pick</span>
            <span className="block truncate text-[14px] font-semibold">{place.name}</span>
          </span>
        </div>
      )}

      {/* People */}
      <div className="mt-5 flex items-center justify-between">
        <h3 className="font-heading text-[16px] font-bold">People</h3>
        <span className="text-[11px] text-muted">{editable ? "Tap someone to remove them" : `${people.length} invited`}</span>
      </div>
      <ul className="reveal card mt-2 grid grid-cols-4 gap-y-3 p-3">
        {people.map((id) => {
          const st = id === plan.adminId ? "admin" : plan.invites[id];
          const canRemove = editable && id !== plan.adminId;
          const content = (
            <>
              <span className="relative">
                <Avatar personId={id} size={52} />
                <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${DOT[st]}`} />
                {id === plan.adminId && (
                  <span className="absolute -top-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-ink text-cream">
                    <Crown size={11} />
                  </span>
                )}
              </span>
              <span className="w-full truncate text-center text-[11px] font-medium">
                {id === CURRENT_USER_ID ? "You" : getPerson(id).name}
              </span>
            </>
          );
          return (
            <li key={id}>
              {canRemove ? (
                <button
                  onClick={() => setRemoving(id)}
                  aria-label={`Remove ${getPerson(id).name}`}
                  className="flex w-full flex-col items-center gap-1"
                >
                  {content}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1">{content}</div>
              )}
            </li>
          );
        })}
        {editable && (
          <li>
            <button onClick={() => setAdding(true)} className="flex w-full flex-col items-center gap-1" aria-label="Add people">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-dashed border-brand bg-cream text-brand">
                <Plus size={22} />
              </span>
              <span className="text-[11px] font-medium">Add</span>
            </button>
          </li>
        )}
      </ul>
      <div className="mt-2 flex justify-center gap-3 text-[10px] text-muted">
        {(
          [
            ["accepted", "Accepted"],
            ["invited", "Waiting"],
            ["declined", "Declined"],
          ] as const
        ).map(([k, label]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${DOT[k]}`} /> {label}
          </span>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {!plan.archived && (
          <Button block onClick={shareLink}>
            <Link2 size={18} /> Share group link
          </Button>
        )}
        <Button block onClick={() => setConfirm(isAdmin ? "delete" : "leave")}>
          {isAdmin ? <Trash2 size={18} /> : <LogOut size={18} />} {isAdmin ? "Delete plan" : "Leave plan"}
        </Button>
      </div>
    </Screen>
  );
}
