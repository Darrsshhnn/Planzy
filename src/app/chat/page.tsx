"use client";

import { Gavel, ImagePlus, MapPin, MessageSquare, Plus, SendHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { PlaceSearchSheet } from "@/components/chat/place-search-sheet";
import { ShortlistBar, ShortlistSheet } from "@/components/chat/shortlist-sheet";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { RoleSwitch } from "@/components/plan/role-switch";
import { AvatarStack } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPlace } from "@/lib/api/data";
import { formatDateLong } from "@/lib/format";
import { toReviewPhotoDataUrl } from "@/lib/image";
import { simulatedVote } from "@/lib/votes";
import { planActions, usePlan } from "@/store/plan-store";
import { useProfile } from "@/store/profile-store";
import { useViewer } from "@/store/viewer-store";

const VOTE_DELAY_MS = 900;

/** Current position, or null when location is blocked/unavailable (e.g. on plain http). */
function currentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 8000, maximumAge: 60_000 });
  });
}

export default function GroupChatPage() {
  const router = useRouter();
  const plan = usePlan();
  const profile = useProfile();
  const { isAdmin, viewerId } = useViewer();
  const [draft, setDraft] = useState("");
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [toast, setToast] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Mock: friends cast their votes a moment after a place lands in the shortlist.
  useEffect(() => {
    if (plan.decided) return;
    const pending: [string, string][] = [];
    for (const placeId of plan.shortlist) {
      for (const memberId of plan.memberIds) {
        if (memberId === plan.adminId || memberId === viewerId) continue;
        if (!plan.votes[placeId]?.[memberId]) pending.push([placeId, memberId]);
      }
    }
    const timers = pending.slice(0, 1).map(([placeId, memberId], i) =>
      setTimeout(() => {
        const place = getPlace(placeId);
        if (place) planActions.vote(placeId, memberId, simulatedVote(memberId, place, plan));
      }, VOTE_DELAY_MS * (i + 1)),
    );
    return () => timers.forEach(clearTimeout);
  }, [plan, viewerId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [plan.messages.length]);

  if (plan.messages.length === 0) {
    return (
      <Screen>
        <PageHeader title="Group Chat" backHref="/" />
        <EmptyState
          icon={MessageSquare}
          title="No group chat yet"
          body="Start a plan, add friends and Planzy creates a group chat with a shared shortlist to vote on."
          action={
            <ButtonLink href="/plan/start" block>
              Make a Plan
            </ButtonLink>
          }
        />
      </Screen>
    );
  }

  const backHref = plan.flow === "popular" ? "/plan/preferences" : "/plan/recommendations";

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
            liked={plan.favourites}
            onAdd={(id) => planActions.addPlaceFromChat(id, viewerId)}
          />
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
            backHref={backHref}
            subtitle={
              <span className="flex items-center gap-2">
                {plan.memberIds.length} members · {formatDateLong(plan.date)}
              </span>
            }
            right={
              plan.decided ? (
                <Link
                  href="/decision"
                  className="flex h-[36px] items-center gap-1.5 rounded-[10px] bg-ink px-3 text-[13px] font-semibold text-white"
                >
                  Compare
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
          {attachOpen && (
            <div className="card absolute bottom-[58px] left-4 z-10 w-[200px] overflow-hidden p-1" role="menu">
              <button
                role="menuitem"
                onClick={() => photoRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[14px] hover:bg-cream"
              >
                <ImagePlus size={20} className="text-brand" /> Upload image
              </button>
              <button
                role="menuitem"
                onClick={sendLocation}
                className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[14px] hover:bg-cream"
              >
                <MapPin size={20} className="text-brand" /> Share location
              </button>
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
              aria-label={attachOpen ? "Close attachments" : "Attach photo or location"}
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
        </div>
      </div>
    </Screen>
  );
}
