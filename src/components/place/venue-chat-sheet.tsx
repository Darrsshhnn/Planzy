"use client";

import { SendHorizontal, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { formatClock } from "@/lib/format";
import type { Place } from "@/lib/types";
import { sendVenueMessage, useVenueChat } from "@/store/venue-chat-store";

const QUICK = ["What are your timings?", "Price per person?", "Is parking available?", "Any slots today?"];

/** In-app chat with a venue (no phone calls). */
export function VenueChatSheet({ place, open, onClose }: { place: Place; open: boolean; onClose: () => void }) {
  const messages = useVenueChat(place.id);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);

  const send = (text: string) => {
    sendVenueMessage(place.id, text);
    setDraft("");
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Message ${place.name}`}>
      <p className="-mt-1 flex items-center gap-1.5 text-[12px] text-muted">
        <Store size={14} className="text-brand" /> Usually replies within a few minutes
      </p>
      <div ref={listRef} className="no-scrollbar mt-3 max-h-[300px] min-h-[140px] space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="py-6 text-center text-[13px] text-muted">Ask the venue anything before you go.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[80%]">
              <p
                className={[
                  "rounded-[16px] px-3.5 py-2 text-[14px] leading-[20px] text-white",
                  m.from === "me" ? "rounded-br-[4px] bg-brand" : "rounded-bl-[4px] bg-ink",
                ].join(" ")}
              >
                {m.text}
              </p>
              <p className={`mt-0.5 text-[10px] text-muted ${m.from === "me" ? "text-right" : ""}`}>
                {m.from === "venue" ? `${place.name} · ` : ""}
                {formatClock(m.at)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="h-[30px] shrink-0 rounded-full border border-ink bg-paper px-3 text-[12px]"
          >
            {q}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          aria-label="Message the venue"
          className="h-[42px] min-w-0 flex-1 rounded-full border border-ink bg-paper px-4 text-[14px] outline-none focus:border-brand"
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
    </Sheet>
  );
}
