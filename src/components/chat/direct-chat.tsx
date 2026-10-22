"use client";

import { SendHorizontal, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { Avatar } from "@/components/ui/avatar";
import { getFriends, getPerson } from "@/lib/api/data";
import { formatClock } from "@/lib/format";
import { sendDirect, useThread } from "@/store/dm-store";
import { planActions } from "@/store/plan-store";

/** Personal chat with one friend. */
export function DirectChat({ friendId }: { friendId: string }) {
  const router = useRouter();
  const messages = useThread(friendId);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const known = getFriends().some((f) => f.id === friendId);
  const friend = getPerson(friendId);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (!known) {
    return (
      <Screen>
        <PageHeader title="Chat" backHref="/chat" />
        <p className="mt-10 text-center text-[14px] text-muted">We couldn&apos;t find this person.</p>
      </Screen>
    );
  }

  return (
    <Screen padded={false} className="!pb-0">
      <div className="flex h-full flex-col">
        <div className="shrink-0 px-5">
          <PageHeader
            title={friend.name}
            backHref="/chat"
            subtitle="Personal chat"
            right={
              <button
                onClick={() => {
                  planActions.start("new", [friendId]);
                  router.push("/plan/friends");
                }}
                className="flex h-[34px] items-center gap-1.5 rounded-[10px] bg-ink px-3 text-[12px] font-semibold text-white"
              >
                <UsersRound size={15} /> Plan together
              </button>
            }
          />
        </div>
        <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto border-t border-ink/10 px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center pt-10 text-center">
              <Avatar personId={friendId} size={64} />
              <p className="mt-3 text-[14px] font-semibold">Say hi to {friend.name}</p>
              <p className="text-[12px] text-muted">Messages here are just between the two of you.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex items-end gap-2 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
              {m.from === "them" && <Avatar personId={friendId} size={28} />}
              <div className={`flex max-w-[75%] flex-col ${m.from === "me" ? "items-end" : "items-start"}`}>
                <p
                  className={`rounded-[16px] px-3.5 py-2 text-[14px] leading-[20px] text-white ${
                    m.from === "me" ? "rounded-br-[4px] bg-brand" : "rounded-bl-[4px] bg-ink"
                  }`}
                >
                  {m.text}
                </p>
                <span className="mx-1 mt-0.5 text-[10px] text-muted">{formatClock(m.at)}</span>
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendDirect(friendId, draft);
            setDraft("");
          }}
          className="mb-[104px] flex shrink-0 items-center gap-2 border-t border-ink/10 bg-white px-4 pt-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${friend.name}`}
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
    </Screen>
  );
}
