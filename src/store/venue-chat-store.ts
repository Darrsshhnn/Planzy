"use client";

/**
 * In-app messages between the user and a venue, per place, persisted to
 * localStorage. Venue replies are mocked; a backend would relay them.
 */
import { useSyncExternalStore } from "react";
import { getPlace } from "@/lib/api/data";
import { formatTime } from "@/lib/time";

export interface VenueMessage {
  id: string;
  from: "me" | "venue";
  text: string;
  at: number;
}

const STORAGE_KEY = "planzy:venue-chat:v1";
const EMPTY: VenueMessage[] = [];
let state: Record<string, VenueMessage[]> = {};
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    state = {};
  }
}

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep working in memory if storage is unavailable.
  }
}

function push(placeId: string, msg: VenueMessage) {
  state = { ...state, [placeId]: [...(state[placeId] ?? []), msg] };
  save();
  emit();
}

export function useVenueChat(placeId: string): VenueMessage[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      ensureLoaded();
      return state[placeId] ?? EMPTY;
    },
    () => EMPTY,
  );
}

/** Mock venue reply, picked by what the message asks about. */
function venueReply(placeId: string, text: string) {
  const place = getPlace(placeId);
  if (!place) return "Thanks for your message! We'll get back to you shortly.";
  const t = text.toLowerCase();
  if (/time|open|close|hour|timing/.test(t))
    return `We're open ${formatTime(place.open)} to ${formatTime(place.close)} (${place.hours.weekday}).`;
  if (/price|cost|rate|charge|₹|rs/.test(t))
    return place.hourly
      ? `It's ₹${place.hourly.rate} per ${place.hourly.unit} per hour. Book 2+ hours for a free extra 15 minutes.`
      : `It's about ₹${place.pricePerPerson} per person. Group offers available on weekdays.`;
  if (/park/.test(t)) return "Yes, parking is available nearby.";
  if (/book|slot|available|reserve|table/.test(t))
    return place.category === "Food"
      ? "No booking needed, just walk in! Weekends can have a short wait."
      : `Right now it's ${place.live.crowd.toLowerCase()}. You can book a slot from your Planzy group.`;
  return `Hi! Thanks for reaching out to ${place.name}. How can we help?`;
}

export function sendVenueMessage(placeId: string, text: string) {
  const body = text.trim();
  if (!body) return;
  ensureLoaded();
  push(placeId, { id: `v${Date.now().toString(36)}`, from: "me", text: body, at: Date.now() });
  setTimeout(() => {
    push(placeId, { id: `v${Date.now().toString(36)}r`, from: "venue", text: venueReply(placeId, body), at: Date.now() });
  }, 1200);
}
