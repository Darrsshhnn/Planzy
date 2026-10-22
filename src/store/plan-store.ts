"use client";

/**
 * Shared plan state for every screen.
 *
 * A tiny external store (no extra dependency) persisted to localStorage and
 * synced across tabs. To add a backend later, keep the action names and
 * make each one call the API before (or after) updating local state.
 */
import { useSyncExternalStore } from "react";
import { greetingLine, placeAddedLine, replyLine, REPLY_DELAY_MS } from "@/lib/api/chat";
import { getMe, getPerson, getPlace } from "@/lib/api/data";
import { hash, joinNames } from "@/lib/format";
import { rankShortlist } from "@/lib/votes";
import type { Booking, Category, ChatMessage, PlanFlow, PlanState, TimeSlot, Vote } from "@/lib/types";

const STORAGE_KEY = "planzy:plan:v1";
const ME = getMe().id;

const emptyBooking: Booking = { status: "none", slot: "", people: 0, payMode: "now", method: "upi", amount: 0 };

export const initialPlan: PlanState = {
  flow: null,
  adminId: ME,
  memberIds: [ME],
  groupName: "",
  categories: [],
  date: "",
  budget: 500,
  distance: 10,
  timeSlot: "Evening",
  onlyOpen: true,
  shortlist: [],
  votes: {},
  messages: [],
  decided: false,
  locked: false,
  chosenPlaceId: null,
  booking: emptyBooking,
  favourites: [],
};

let state: PlanState = initialPlan;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function read(): PlanState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialPlan, ...JSON.parse(raw) } : initialPlan;
  } catch {
    return initialPlan;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = read();
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = read();
    emit();
  });
}

function set(update: (s: PlanState) => PlanState) {
  ensureLoaded();
  state = update(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode); state still works in memory.
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return initialPlan;
}

/** Re-renders plan screens without changing plan data (e.g. after a profile edit renames "me"). */
export function refreshPlanSubscribers() {
  ensureLoaded();
  state = { ...state };
  emit();
}

export function usePlan(): PlanState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

let seq = 0;
function msgId() {
  seq += 1;
  return `m${Date.now().toString(36)}${seq}`;
}

function text(authorId: string, body: string): ChatMessage {
  return { id: msgId(), kind: "text", authorId, text: body, at: Date.now() };
}

function system(body: string): ChatMessage {
  return { id: msgId(), kind: "system", text: body, at: Date.now() };
}

function alert(body: string): ChatMessage {
  return { id: msgId(), kind: "alert", text: body, at: Date.now() };
}

function reference(prefix: string) {
  return `PLZ-${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function defaultGroupName(memberIds: string[]) {
  const friends = memberIds.filter((id) => id !== ME).map((id) => getPerson(id).name);
  return friends.length ? `Plan with ${joinNames(friends)}` : "My Plan";
}

export const planActions = {
  /** Starts a fresh plan. Favourites survive, everything else resets. */
  start(flow: PlanFlow, presetMemberIds: string[] = []) {
    set((s) => ({
      ...initialPlan,
      favourites: s.favourites,
      flow,
      memberIds: [ME, ...presetMemberIds.filter((id) => id !== ME)],
    }));
  },

  setFlow(flow: PlanFlow) {
    set((s) => ({ ...s, flow }));
  },

  setShortlist(shortlist: string[]) {
    set((s) => ({ ...s, shortlist }));
  },

  choosePopularPlace(placeId: string) {
    const place = getPlace(placeId);
    set((s) => ({
      ...s,
      shortlist: [placeId],
      categories: place && !s.categories.includes(place.category) ? [place.category] : s.categories,
    }));
  },

  toggleMember(id: string) {
    if (id === ME) return;
    set((s) => ({ ...s, memberIds: toggle(s.memberIds, id) }));
  },

  setGroupName(groupName: string) {
    set((s) => ({ ...s, groupName }));
  },

  toggleCategory(category: Category) {
    set((s) => ({ ...s, categories: toggle(s.categories, category) }));
  },

  setDate(date: string) {
    set((s) => ({ ...s, date }));
  },

  setBudget(budget: number) {
    set((s) => ({ ...s, budget }));
  },

  setDistance(distance: number) {
    set((s) => ({ ...s, distance }));
  },

  setTimeSlot(timeSlot: TimeSlot) {
    set((s) => ({ ...s, timeSlot }));
  },

  setOnlyOpen(onlyOpen: boolean) {
    set((s) => ({ ...s, onlyOpen }));
  },

  toggleShortlist(placeId: string) {
    set((s) => ({ ...s, shortlist: toggle(s.shortlist, placeId) }));
  },

  /** Creates the group chat (once) and seeds it with the shortlist. */
  openGroupChat() {
    set((s) => {
      if (s.messages.length) return s;
      const groupName = s.groupName.trim() || defaultGroupName(s.memberIds);
      const friends = s.memberIds.filter((id) => id !== ME);
      const seed: ChatMessage[] = [
        system(`${getPerson(ME).name} created "${groupName}"`),
        ...friends.slice(0, 2).map((id, i) => text(id, greetingLine(hash(id) + i))),
        ...s.shortlist.map<ChatMessage>((placeId) => ({
          id: msgId(),
          kind: "place",
          authorId: ME,
          placeId,
          at: Date.now(),
        })),
        system("Vote In, Maybe or Can't on each place. The admin taps Decide when ready."),
      ];
      return { ...s, groupName, messages: seed };
    });
  },

  sendMessage(body: string, authorId: string = ME) {
    const trimmed = body.trim();
    if (!trimmed) return;
    set((s) => ({ ...s, messages: [...s.messages, text(authorId, trimmed)] }));
    // Mock: someone else in the group replies shortly after.
    const others = state.memberIds.filter((id) => id !== authorId);
    if (!others.length) return;
    const replier = others[hash(trimmed) % others.length];
    setTimeout(() => {
      set((s) => ({ ...s, messages: [...s.messages, text(replier, replyLine(hash(trimmed + replier)))] }));
    }, REPLY_DELAY_MS);
  },

  sendImage(src: string, authorId: string = ME) {
    set((s) => ({ ...s, messages: [...s.messages, { id: msgId(), kind: "image", authorId, src, at: Date.now() }] }));
  },

  shareLocation(loc: { label: string; lat?: number; lng?: number }, authorId: string = ME) {
    set((s) => ({ ...s, messages: [...s.messages, { id: msgId(), kind: "location", authorId, ...loc, at: Date.now() }] }));
  },

  /** Posts a notification to the whole group (shown highlighted in the chat). Skips exact repeats. */
  notifyGroup(body: string) {
    set((s) => {
      const last = s.messages.at(-1);
      if (last?.kind === "alert" && last.text === body) return s;
      return { ...s, messages: [...s.messages, alert(body)] };
    });
  },

  /** In-chat search: adds a place to the shared shortlist and posts it. */
  addPlaceFromChat(placeId: string, authorId: string = ME) {
    set((s) => {
      if (s.shortlist.includes(placeId)) return s;
      const card: ChatMessage = { id: msgId(), kind: "place", authorId, placeId, at: Date.now() };
      return { ...s, shortlist: [...s.shortlist, placeId], messages: [...s.messages, card] };
    });
    const others = state.memberIds.filter((id) => id !== authorId);
    if (!others.length) return;
    const replier = others[hash(placeId) % others.length];
    setTimeout(() => {
      set((s) => ({ ...s, messages: [...s.messages, text(replier, placeAddedLine(hash(placeId + replier)))] }));
    }, REPLY_DELAY_MS);
  },

  vote(placeId: string, memberId: string, vote: Vote) {
    set((s) => {
      if (s.decided) return s;
      return { ...s, votes: { ...s.votes, [placeId]: { ...s.votes[placeId], [memberId]: vote } } };
    });
  },

  /** Admin closes voting; the leading place is preselected for Final Decision. */
  decide() {
    set((s) => {
      const ranked = rankShortlist(s, getPlace);
      return {
        ...s,
        decided: true,
        chosenPlaceId: ranked[0]?.place.id ?? null,
        messages: [...s.messages, system(`${getPerson(s.adminId).name} closed voting. Comparing the top picks.`)],
      };
    });
  },

  reopenVoting() {
    set((s) => ({
      ...s,
      decided: false,
      locked: false,
      messages: [...s.messages, system("Voting reopened.")],
    }));
  },

  choosePlace(placeId: string) {
    set((s) => ({ ...s, chosenPlaceId: placeId }));
  },

  lockChoice() {
    set((s) => {
      const place = getPlace(s.chosenPlaceId);
      if (!place) return s;
      // Food places: no pre-payment or booking for now, the group just walks in.
      if (place.category === "Food") {
        return {
          ...s,
          locked: true,
          booking: { ...emptyBooking, status: "walk-in", people: s.memberIds.length, reference: reference("WALKIN") },
          messages: [...s.messages, system(`Final pick: ${place.name}. Walk-in, no booking needed. See you there!`)],
        };
      }
      return {
        ...s,
        locked: true,
        booking: { ...emptyBooking, people: s.memberIds.length },
        messages: [...s.messages, system(`Final pick: ${place.name}. Waiting for the admin to book.`)],
      };
    });
  },

  setBooking(patch: Partial<Booking>) {
    set((s) => ({ ...s, booking: { ...s.booking, ...patch } }));
  },

  completePayment(result: { reference: string; paidAt: number; amount: number }) {
    set((s) => {
      const place = getPlace(s.chosenPlaceId);
      return {
        ...s,
        booking: { ...s.booking, status: "paid", ...result },
        messages: [
          ...s.messages,
          system(`Booked ${place?.name ?? "the place"} for ${s.booking.slot}. You're locked in!`),
        ],
      };
    });
  },

  /** Slot held without paying now; the group pays on reaching the venue (cash or UPI). */
  confirmPayAtVenue(amount: number) {
    set((s) => {
      const place = getPlace(s.chosenPlaceId);
      const how = s.booking.method === "cash" ? "cash" : "UPI";
      return {
        ...s,
        booking: { ...s.booking, status: "pay-at-venue", amount, reference: reference("VENUE"), paidAt: undefined },
        messages: [
          ...s.messages,
          system(`Reserved ${place?.name ?? "the place"} for ${s.booking.slot}. Pay ₹${amount} at the venue by ${how}.`),
        ],
      };
    });
  },

  /** Demo helper: clears the current plan but keeps favourites. */
  reset() {
    set((s) => ({ ...initialPlan, favourites: s.favourites }));
  },

  toggleFavourite(placeId: string) {
    set((s) => ({ ...s, favourites: toggle(s.favourites, placeId) }));
  },
};

export const CURRENT_USER_ID = ME;
