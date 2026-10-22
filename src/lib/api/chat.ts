/**
 * Mock chat service. Picks canned lines for simulated friends.
 * Replace with a realtime channel (websocket, Firebase, etc.) later.
 */
import chatJson from "@/data/chat.json";

function pick(list: string[], seed: number) {
  return list[Math.abs(seed) % list.length];
}

export function greetingLine(seed: number) {
  return pick(chatJson.greetings, seed);
}

export function replyLine(seed: number) {
  return pick(chatJson.replies, seed);
}

export function placeAddedLine(seed: number) {
  return pick(chatJson.onPlaceAdded, seed);
}

/** Simulated network latency for a friend's reply. */
export const REPLY_DELAY_MS = 1400;
