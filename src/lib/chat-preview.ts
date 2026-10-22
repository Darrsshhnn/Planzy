import { getPerson, getPlace } from "@/lib/api/data";
import type { ChatMessage } from "@/lib/types";

/** One-line preview of a chat message for lists and cards. */
export function previewMessage(m: ChatMessage | undefined) {
  if (!m) return "";
  if (m.kind === "system" || m.kind === "alert") return m.text;
  const who = getPerson(m.authorId).name;
  if (m.kind === "text") return `${who}: ${m.text}`;
  if (m.kind === "image") return `${who} shared a photo`;
  if (m.kind === "location") return `${who} shared a location`;
  return `${who} added ${getPlace(m.placeId)?.name ?? "a place"}`;
}

/** "3:05 pm" today, "Mon" this week, otherwise "12 Oct". */
export function shortWhen(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (now.getTime() - ts < 6 * 24 * 60 * 60 * 1000) return d.toLocaleDateString("en-IN", { weekday: "short" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
