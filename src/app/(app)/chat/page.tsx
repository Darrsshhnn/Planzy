"use client";

import { MessageSquarePlus, Search } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { Avatar } from "@/components/ui/avatar";
import { GroupFaces } from "@/components/ui/group-faces";
import { FieldBox } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { getFriends, getPerson } from "@/lib/api/data";
import { previewMessage, shortWhen } from "@/lib/chat-preview";
import type { PlanState } from "@/lib/types";
import { useThreads } from "@/store/dm-store";
import { CURRENT_USER_ID, usePlans } from "@/store/plan-store";

type Tab = "all" | "groups" | "personal";

function badgeFor(plan: PlanState): { label: string; className: string } | null {
  if (plan.invites[CURRENT_USER_ID] === "invited") return { label: "Invite", className: "bg-brand text-white" };
  if (plan.archived) return null;
  if (plan.booking.status !== "none") return { label: "Booked", className: "bg-[#E3F7EA] text-[#1a7f45]" };
  if (plan.decided) return { label: "Deciding", className: "bg-cream text-ink" };
  return { label: "Voting", className: "bg-cream text-ink" };
}

function Row({
  href,
  avatar,
  title,
  preview,
  when,
  badge,
}: {
  href: string;
  avatar: ReactNode;
  title: string;
  preview: string;
  when?: number;
  badge?: { label: string; className: string } | null;
}) {
  return (
    <li className="reveal">
      <Link href={href} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-cream/70 active:bg-cream">
        <span className="flex w-[50px] shrink-0 justify-center">{avatar}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-[15px] font-semibold">{title}</span>
            {when !== undefined && <span className="shrink-0 text-[11px] text-muted">{shortWhen(when)}</span>}
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className="truncate text-[12px] text-muted">{preview}</span>
            {badge && (
              <span className={`shrink-0 rounded-full px-2 text-[10px] font-semibold leading-[18px] ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** One card per section; rows split by clearly visible lines. */
function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="flex items-center gap-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-ink/70">
        {title}
        <span className="rounded-full bg-ink px-1.5 text-[10px] leading-[16px] text-cream">{count}</span>
      </h2>
      <ul className="card mt-2 divide-y divide-ink/20 overflow-hidden p-0!">{children}</ul>
    </section>
  );
}

export default function ChatsPage() {
  const { plans, ready } = usePlans();
  const threads = useThreads();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [picking, setPicking] = useState(false);

  const q = query.trim().toLowerCase();
  const matches = (name: string) => !q || name.toLowerCase().includes(q);
  const lastAt = (p: PlanState) => p.messages.at(-1)?.at ?? p.createdAt;

  const mine = plans
    .filter((p) => p.created && (p.memberIds.includes(CURRENT_USER_ID) || p.invites[CURRENT_USER_ID] === "invited"))
    .filter((p) => matches(p.groupName))
    .sort((a, b) => lastAt(b) - lastAt(a));
  const invites = mine.filter((p) => p.invites[CURRENT_USER_ID] === "invited");
  const running = mine.filter((p) => !p.archived && p.invites[CURRENT_USER_ID] !== "invited");
  const old = mine.filter((p) => p.archived);
  const personal = Object.entries(threads)
    .filter(([id, msgs]) => msgs.length && matches(getPerson(id).name))
    .sort(([, a], [, b]) => b.at(-1)!.at - a.at(-1)!.at);

  const showGroups = tab !== "personal";
  const showPersonal = tab !== "groups";
  const groupRow = (p: PlanState) => (
    <Row
      key={p.id}
      href={`/chat/${p.id}`}
      avatar={<GroupFaces ids={p.memberIds} size={48} />}
      title={p.groupName}
      preview={previewMessage(p.messages.at(-1))}
      when={lastAt(p)}
      badge={badgeFor(p)}
    />
  );
  const empty =
    ready &&
    (showGroups ? invites.length + running.length + old.length : 0) + (showPersonal ? personal.length : 0) === 0;

  return (
    <Screen
      overlay={
        <Sheet open={picking} onClose={() => setPicking(false)} title="New chat">
          <ul className="divide-y divide-ink/10">
            {getFriends().map((f) => (
              <li key={f.id}>
                <Link
                  href={`/chat/dm/${f.id}`}
                  onClick={() => setPicking(false)}
                  className="flex items-center gap-3 py-2.5"
                >
                  <Avatar personId={f.id} size={40} />
                  <span className="text-[14px]">{f.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>
      }
    >
      <PageHeader
        title="Chats"
        noBack
        right={
          <button
            onClick={() => setPicking(true)}
            aria-label="New chat with a friend"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-cream"
          >
            <MessageSquarePlus size={19} />
          </button>
        }
      />
      <FieldBox className="flex h-[44px] items-center gap-2 px-4">
        <Search size={19} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink/40"
        />
      </FieldBox>
      <div className="mt-3 grid grid-cols-3 rounded-full bg-cream p-1" role="tablist">
        {(
          [
            ["all", "All"],
            ["groups", "Groups"],
            ["personal", "Personal"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-8 rounded-full text-[13px] font-semibold transition ${tab === id ? "bg-ink text-white" : "text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {showGroups && invites.length > 0 && <Section title="Invites" count={invites.length}>{invites.map(groupRow)}</Section>}
      {showGroups && running.length > 0 && <Section title="Running plans" count={running.length}>{running.map(groupRow)}</Section>}
      {showPersonal && personal.length > 0 && (
        <Section title="Personal" count={personal.length}>
          {personal.map(([id, msgs]) => {
            const last = msgs.at(-1)!;
            return (
              <Row
                key={id}
                href={`/chat/dm/${id}`}
                avatar={<Avatar personId={id} size={48} />}
                title={getPerson(id).name}
                preview={`${last.from === "me" ? "You: " : ""}${last.text}`}
                when={last.at}
              />
            );
          })}
        </Section>
      )}
      {showGroups && old.length > 0 && <Section title="Old chats" count={old.length}>{old.map(groupRow)}</Section>}

      {empty && (
        <div className="mt-12 text-center">
          <p className="text-[14px] font-semibold">{q ? "No chats match" : "No chats yet"}</p>
          <p className="mt-1 text-[12px] text-muted">
            {q ? "Try another name." : "Make a plan with friends, or start a personal chat."}
          </p>
          {!q && (
            <Link
              href="/plan/new"
              className="mt-4 inline-block rounded-[10px] bg-ink px-4 py-2.5 text-[14px] font-semibold text-white"
            >
              Make a plan
            </Link>
          )}
        </div>
      )}
    </Screen>
  );
}
