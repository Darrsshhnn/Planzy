"use client";

import { Archive, Gavel, ImagePlus, Link2, MapPin, MessageSquare, Plus, SendHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { JoinSheet } from "@/components/chat/join-sheet";
import { MessageBubble } from "@/components/chat/message-bubble";
import { PlaceSearchSheet } from "@/components/chat/place-search-sheet";
import { ShortlistBar, ShortlistSheet } from "@/components/chat/shortlist-sheet";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { RoleSwitch } from "@/components/plan/role-switch";
import { AvatarStack } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPerson, getPlace } from "@/lib/api/data";
import { formatDateLong } from "@/lib/format";
import { currentPosition } from "@/lib/geo";
import { toReviewPhotoDataUrl } from "@/lib/image";
import { simulatedVote } from "@/lib/votes";
import { useProfile } from "@/store/account-store";
import {
  advanceSimulatedAdmin,
  CURRENT_USER_ID,
  planActions,
  useFavourites,
  usePlan,
  usePlans,
} from "@/store/plan-store";
import { useViewer } from "@/store/viewer-store";

const VOTE_DELAY_MS = 900;

export function GroupChat({ planId }: { planId: string }) {
  const router = useRouter();
  const { currentId, ready } = usePlans();
  const plan = usePlan();
  const favourites = useFavourites();
  const profile = useProfile();
  const { isAdmin, viewerId } = useViewer();
  const [draft, setDraft] = useState("");
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Opening a chat makes it the current plan for Decision / Booking screens.
  useLayoutEffect(() => {
    planActions.select(planId);
  }, [planId]);

  const isOpen = plan.id === planId;
  const myInvite = plan.invites[CURRENT_USER_ID];
  const member = plan.memberIds.includes(CURRENT_USER_ID);
  const canChat = isOpen && member && !plan.archived;

  // Mock: friends cast their votes a moment after a place lands in the shortlist.
  useEffect(() => {
    if (!isOpen || plan.decided || plan.archived) return;
    const pending: [string, string][] = [];
    for (const placeId of plan.shortlist) {
      for (const memberId of plan.memberIds) {
        if (memberId === CURRENT_USER_ID || memberId === viewerId) continue;
        if (!plan.votes[placeId]?.[memberId]) pending.push([placeId, memberId]);
      }
    }
    const timers = pending.slice(0, 1).map(([placeId, memberId]) =>
      setTimeout(() => {
        const place = getPlace(placeId);
        if (place) planActions.vote(placeId, memberId, simulatedVote(memberId, place, plan));
      }, VOTE_DELAY_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [plan, viewerId, isOpen]);

  // Groups someone else runs: their admin decides and books once everyone voted.
  useEffect(() => {
    if (isOpen && member) advanceSimulatedAdmin(plan.id);
  }, [plan, isOpen, member]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [plan.messages.length]);

  if (ready && currentId !== planId && !isOpen) {
    return (
      <Screen>
        <PageHeader title="Chat" backHref="/chat" />
        <EmptyState
          icon={MessageSquare}
          title="Chat not found"
          body="This group may have been deleted, or you left it."
          action={
            <ButtonLink href="/chat" block>
              Back to Chats
            </ButtonLink>
          }
        />
      </Screen>
    );
  }
  if (!isOpen) return null;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const send = () => {
    planActions.sendMessage(draft, viewerId);
    setDraft("");
  };

  const decide = () => {
    planActions.decide();
    router.push("/decision");
  };

  const sendPhoto = async (file: File | undefined) => {
    setAttachOpen(false);
    if (!file) return;
    try {
      planActions.sendImage(await toReviewPhotoDataUrl(file), viewerId);
    } catch {
      flash("Couldn't read that photo");
    }
  };

  const sendLocation = async () => {
    setAttachOpen(false);
    flash("Getting your location…");
    const pos = await currentPosition();
    if (pos) {
      const { latitude: lat, longitude: lng } = pos.coords;
      planActions.shareLocation({ label: `Live location · ${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng }, viewerId);
      setToast("");
    } else {
      // Browsers only allow GPS on secure (https) pages; fall back to the profile area.
      planActions.shareLocation({ label: profile.location }, viewerId);
      flash("GPS unavailable, shared your area instead");
    }
  };

  const shareLink = async () => {
    setAttachOpen(false);
    const url = `${window.location.origin}/chat/${plan.id}`;
    const data = { title: plan.groupName, text: `Join "${plan.groupName}" on Planzy`, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(`${data.text}: ${url}`);
      flash("Group link copied");
    } catch {
      flash("Couldn't share right now");
    }
  };

  const status = plan.archived
    ? "Old chat"
    : `${plan.memberIds.length} members · ${formatDateLong(plan.date).replace(/,? \d{4}$/, "")}`;

  return (
    <Screen
      padded={false}
      className="!pb-0"
      overlay={
        <>
          <ShortlistSheet
            open={shortlistOpen}
            onClose={() => setShortlistOpen(false)}
            plan={plan}
            viewerId={viewerId}
            isAdmin={isAdmin}
            canVote={member && !plan.archived}
            onVote={(placeId, v) => planActions.vote(placeId, viewerId, v)}
            onAddPlace={() => {
              setShortlistOpen(false);
              setSearchOpen(true);
            }}
          />
          <PlaceSearchSheet
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            shortlist={plan.shortlist}
            liked={favourites}
            onAdd={(id) => planActions.addPlaceFromChat(id, viewerId)}
          />
          <JoinSheet open={joining} plan={plan} onClose={() => setJoining(false)} />
          {toast && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[170px] z-40 flex justify-center">
              <span className="rounded-full bg-ink px-4 py-2 text-[13px] text-white">{toast}</span>
            </div>
          )}
        </>
      }
    >
      <div className="flex h-full flex-col">
        <div className="shrink-0 px-5">
          <PageHeader
            title={plan.groupName}
            backHref="/chat"
            titleHref={`/chat/${plan.id}/details`}
            subtitle={status}
            right={
              plan.decided || plan.archived ? (
                <Link
                  href={plan.booking.status !== "none" ? "/locked" : "/decision"}
                  className="flex h-[34px] items-center rounded-[10px] bg-ink px-3 text-[13px] font-semibold text-white"
                >
                  {plan.booking.status !== "none" ? "Plan" : "Compare"}
                </Link>
              ) : isAdmin ? (
                <Button
                  variant="brand"
                  size="sm"
                  onClick={decide}
                  disabled={plan.shortlist.length === 0}
                  aria-label="Decide: close voting and compare"
                >
                  <Gavel size={15} /> Decide
                </Button>
              ) : (
                <AvatarStack ids={plan.memberIds} size={26} max={3} />
              )
            }
          />
          <RoleSwitch />
        </div>

        <div className="shrink-0 pb-3">
          <ShortlistBar plan={plan} onOpen={() => setShortlistOpen(true)} />
        </div>

        <div
          ref={listRef}
          className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto border-t border-ink/10 px-4 py-4"
        >
          {plan.messages.map((m) => (
            <MessageBubble key={m.id} message={m} viewerId={viewerId} />
          ))}
        </div>

        <div className="relative mb-[104px] shrink-0 border-t border-ink/10 bg-white px-4 pt-3">
          {myInvite === "invited" ? (
            <div className="card flex items-center gap-3 bg-cream! p-3">
              <p className="min-w-0 flex-1 text-[13px]">
                <span className="font-semibold">{getPerson(plan.adminId).name}</span> invited you to this group
              </p>
              <Button size="sm" variant="outline" onClick={() => planActions.declineInvite(plan.id)}>
                Decline
              </Button>
              <Button size="sm" onClick={() => setJoining(true)}>
                Accept
              </Button>
            </div>
          ) : plan.archived ? (
            <p className="flex items-center justify-center gap-2 py-2.5 text-[13px] text-muted">
              <Archive size={16} /> This outing is over. The chat is read-only.
            </p>
          ) : !canChat ? (
            <p className="py-2.5 text-center text-[13px] text-muted">You&apos;re no longer in this group.</p>
          ) : (
            <>
              {attachOpen && (
                <div className="card absolute bottom-[58px] left-4 z-10 w-[210px] overflow-hidden p-1" role="menu">
                  <AttachItem icon={ImagePlus} label="Upload image" onClick={() => photoRef.current?.click()} />
                  <AttachItem icon={MapPin} label="Share location" onClick={sendLocation} />
                  <AttachItem icon={Link2} label="Share group link" onClick={shareLink} />
                </div>
              )}
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  sendPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setAttachOpen((o) => !o)}
                  aria-label={attachOpen ? "Close attachments" : "Attach photo, location or link"}
                  aria-expanded={attachOpen}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-cream"
                >
                  {attachOpen ? <X size={20} /> : <Plus size={22} />}
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onFocus={() => setAttachOpen(false)}
                  placeholder="Message the group"
                  aria-label="Message"
                  className="h-[42px] min-w-0 flex-1 rounded-full border border-ink bg-paper px-4 text-[14px] outline-none placeholder:text-ink/40 focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40"
                >
                  <SendHorizontal size={20} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Screen>
  );
}

function AttachItem({ icon: Icon, label, onClick }: { icon: typeof MapPin; label: string; onClick: () => void }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[14px] hover:bg-cream"
    >
      <Icon size={20} className="text-brand" /> {label}
    </button>
  );
}
