"use client";

import { Bell, BellRing, Check, UserCheck, UserX, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { JoinSheet } from "@/components/chat/join-sheet";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { shortWhen } from "@/lib/chat-preview";
import { CURRENT_USER_ID, EMPTY_PLAN, planActions, useNotifications, usePlans } from "@/store/plan-store";

/** Group invites to accept or decline, and replies to invites you sent. */
export default function NotificationsPage() {
  const notifications = useNotifications();
  const { plans } = usePlans();
  const [joining, setJoining] = useState<string | null>(null);
  const planFor = (id: string) => plans.find((p) => p.id === id);

  // Opening the screen marks replies as seen; invites stay until answered.
  useEffect(() => {
    if (notifications.some((n) => n.kind !== "invite" && !n.read)) {
      const t = setTimeout(() => planActions.markNotificationsRead(), 1500);
      return () => clearTimeout(t);
    }
  }, [notifications]);

  return (
    <Screen
      overlay={
        <JoinSheet
          open={!!joining}
          plan={(joining && planFor(joining)) || EMPTY_PLAN}
          onClose={() => setJoining(null)}
        />
      }
    >
      <PageHeader title="Notifications" backHref="/" />
      {notifications.length === 0 && (
        <EmptyState icon={Bell} title="All caught up" body="Group invites and replies to your invites show up here." />
      )}
      <ul className="space-y-2.5">
        {notifications.map((n) => {
          const plan = planFor(n.planId);
          const pending = n.kind === "invite" && plan?.invites[CURRENT_USER_ID] === "invited";
          const answered = n.kind === "invite" && plan && !pending ? plan.invites[CURRENT_USER_ID] : null;
          const Icon = n.kind === "invite" ? BellRing : n.text.includes("declined") ? UserX : UserCheck;
          return (
            <li key={n.id} className={`reveal card p-3 ${!n.read ? "border-brand! bg-cream!" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-[19px]">{n.text}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{shortWhen(n.at)}</p>
                </div>
              </div>
              {pending && (
                <div className="mt-3 flex gap-2 pl-12">
                  <Button size="sm" variant="outline" onClick={() => planActions.declineInvite(n.planId)}>
                    <X size={14} /> Decline
                  </Button>
                  <Button size="sm" onClick={() => setJoining(n.planId)}>
                    <Check size={14} /> Accept
                  </Button>
                </div>
              )}
              {answered && (
                <p className="mt-2 pl-12 text-[12px] font-semibold text-muted">
                  {answered === "accepted" ? (
                    <Link href={`/chat/${n.planId}`} className="text-brand underline underline-offset-2">
                      Joined · open chat
                    </Link>
                  ) : (
                    "Declined"
                  )}
                </p>
              )}
              {n.kind === "response" && plan && (
                <Link href={`/chat/${n.planId}`} className="mt-2 block pl-12 text-[12px] font-semibold text-brand">
                  Open group
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
