"use client";

/**
 * Every plan (group outing) the user is part of, plus favourites and
 * notifications. A tiny external store persisted to localStorage and synced
 * across tabs. Screens work on the "current" plan (the chat you're in); with a
 * backend, keep the action names and have each one call the API.
 *
 * Friends are simulated: invites get accepted/declined after a few seconds
 * (accepting friends send their budget/distance/timing), friends vote and
 * reply in chat, and in groups someone else runs, that admin decides and books.
 */
import { useSyncExternalStore } from "react";
import { greetingLine, placeAddedLine, replyLine, REPLY_DELAY_MS } from "@/lib/api/chat";
import { getMe, getPerson, getPlace, getRecents } from "@/lib/api/data";
import { hash, joinNames } from "@/lib/format";
import { bookingSlots } from "@/lib/time";
import { rankShortlist } from "@/lib/votes";
import type {
  AppNotification,
  Booking,
  Category,
  ChatMessage,
  MemberPrefs,
  PlanFlow,
  PlanState,
  TimeSlot,
  Vote,
} from "@/lib/types";
import { onProfileChange } from "@/store/account-store";

const STORAGE_KEY = "planzy:store:v2";
const ME = getMe().id;
const DAY = 24 * 60 * 60 * 1000;
const RESPONSE_DELAY_MS = 2500;

const emptyBooking: Booking = { status: "none", slot: "", people: 0, payMode: "now", method: "upi", amount: 0 };

export function newPlan(id: string, over: Partial<PlanState> = {}): PlanState {
  return {
    id,
    createdAt: Date.now(),
    flow: "new",
    adminId: ME,
    memberIds: [ME],
    invites: {},
    memberPrefs: {},
    groupName: "",
    categories: [],
    date: "",
    budget: 500,
    distance: 10,
    timeSlot: "Evening",
    prefsSkipped: false,
    onlyOpen: true,
    shortlist: [],
    votes: {},
    messages: [],
    created: false,
    archived: false,
    decided: false,
    locked: false,
    chosenPlaceId: null,
    booking: emptyBooking,
    ...over,
  };
}

/** Placeholder returned when there is no current plan. */
export const EMPTY_PLAN = newPlan("", { createdAt: 0 });

interface Store {
  plans: Record<string, PlanState>;
  currentId: string | null;
  favourites: string[];
  notifications: AppNotification[];
}

let seq = 0;
function uid(prefix: string) {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq}`;
}

function text(authorId: string, body: string, at = Date.now()): ChatMessage {
  return { id: uid("m"), kind: "text", authorId, text: body, at };
}
function system(body: string, at = Date.now()): ChatMessage {
  return { id: uid("m"), kind: "system", text: body, at };
}
function alert(body: string): ChatMessage {
  return { id: uid("m"), kind: "alert", text: body, at: Date.now() };
}
function placeMsg(authorId: string, placeId: string, at = Date.now()): ChatMessage {
  return { id: uid("m"), kind: "place", authorId, placeId, at };
}
function reference(prefix: string) {
  return `PLZ-${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function isoDate(ts: number) {
  const d = new Date(ts);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** First run: a few finished group chats (from Recents) and one invite to answer. */
function seedStore(): Store {
  const now = Date.now();
  const plans: Record<string, PlanState> = {};
  getRecents().forEach((r, i) => {
    const at = now - (14 + i * 9) * DAY;
    const place = getPlace(r.placeId)!;
    const id = `old-${r.id}`;
    plans[id] = newPlan(id, {
      createdAt: at,
      adminId: r.memberIds[0],
      memberIds: [ME, ...r.memberIds],
      invites: Object.fromEntries([ME, ...r.memberIds.slice(1)].map((m) => [m, "accepted"])),
      groupName: r.groupName,
      categories: [place.category],
      date: isoDate(at + 2 * DAY),
      shortlist: [r.placeId],
      created: true,
      archived: true,
      decided: true,
      locked: true,
      chosenPlaceId: r.placeId,
      booking: {
        ...emptyBooking,
        status: "paid",
        slot: "6:00 P.M.",
        people: r.memberIds.length + 1,
        reference: reference("OLD"),
      },
      messages: [
        system(`${getPerson(r.memberIds[0]).name} created "${r.groupName}"`, at),
        placeMsg(r.memberIds[0], r.placeId, at + 60_000),
        text(r.memberIds[1], greetingLine(i), at + 120_000),
        system(`Booked ${place.name}. You're locked in!`, at + DAY),
        text(r.memberIds[2] ?? r.memberIds[0], "That was so much fun, let's do it again!", at + 3 * DAY),
      ],
    });
  });

  // An invite from Karan: accept it to join as a member.
  const inviteAt = now - 40 * 60_000;
  plans["inv-sunday-cricket"] = newPlan("inv-sunday-cricket", {
    createdAt: inviteAt,
    adminId: "karan",
    memberIds: ["karan", "dev", "umang"],
    invites: { [ME]: "invited", dev: "accepted", umang: "accepted" },
    memberPrefs: {
      dev: { budget: 450, distance: 10, timeSlot: "Night" },
      umang: { budget: 400, distance: 8, timeSlot: "Evening" },
    },
    groupName: "Sunday Box Cricket",
    categories: ["Sports"],
    date: isoDate(now + 4 * DAY),
    budget: 600,
    distance: 12,
    timeSlot: "Night",
    shortlist: ["pitch-perfect-box", "day-n-night-turf"],
    votes: {
      "pitch-perfect-box": { karan: "in", dev: "in", umang: "in" },
      "day-n-night-turf": { karan: "maybe", dev: "maybe", umang: "in" },
    },
    created: true,
    messages: [
      system(`Karan created "Sunday Box Cricket"`, inviteAt),
      placeMsg("karan", "pitch-perfect-box", inviteAt + 30_000),
      placeMsg("karan", "day-n-night-turf", inviteAt + 40_000),
      text("dev", "Night slot works for me 🏏", inviteAt + 120_000),
      text("umang", "In! Who's bringing the bat?", inviteAt + 180_000),
    ],
  });

  return {
    plans,
    currentId: null,
    favourites: [],
    notifications: [
      {
        id: "n-inv-sunday-cricket",
        kind: "invite",
        planId: "inv-sunday-cricket",
        text: `Karan invited you to "Sunday Box Cricket"`,
        at: inviteAt,
        read: false,
      },
    ],
  };
}

const SERVER_STORE: Store = { plans: {}, currentId: null, favourites: [], notifications: [] };
let store: Store = SERVER_STORE;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function read(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...SERVER_STORE, ...JSON.parse(raw) } : seedStore();
  } catch {
    return seedStore();
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage can be unavailable (private mode); state still works in memory.
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  store = read();
  persist();
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    store = read();
    emit();
  });
  onProfileChange(() => {
    store = { ...store };
    emit();
  });
  // Pick up invites that were still waiting when the page was closed.
  for (const plan of Object.values(store.plans)) if (plan.adminId === ME) scheduleResponses(plan.id);
}

function setStore(update: (s: Store) => Store) {
  ensureLoaded();
  store = update(store);
  persist();
  emit();
}

/** Update one plan by id. */
function updatePlan(id: string | null, update: (p: PlanState) => PlanState) {
  if (!id) return;
  setStore((s) => (s.plans[id] ? { ...s, plans: { ...s.plans, [id]: update(s.plans[id]) } } : s));
}

/** Update the current plan. */
function set(update: (p: PlanState) => PlanState) {
  ensureLoaded();
  updatePlan(store.currentId, update);
}

function current(): PlanState {
  ensureLoaded();
  return (store.currentId && store.plans[store.currentId]) || EMPTY_PLAN;
}

function notify(n: Omit<AppNotification, "id" | "at" | "read">) {
  setStore((s) => ({
    ...s,
    notifications: [{ ...n, id: uid("n"), at: Date.now(), read: false }, ...s.notifications].slice(0, 50),
  }));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useStore(): Store {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return store;
    },
    () => SERVER_STORE,
  );
}

/** The plan you're working on (the open chat, or the plan being made). */
export function usePlan(): PlanState {
  const s = useStore();
  return (s.currentId && s.plans[s.currentId]) || EMPTY_PLAN;
}

export function usePlanById(id: string): PlanState | undefined {
  return useStore().plans[id];
}

export function usePlans() {
  const s = useStore();
  return { plans: Object.values(s.plans), currentId: s.currentId, ready: s !== SERVER_STORE };
}

export function useFavourites(): string[] {
  return useStore().favourites;
}

export function useNotifications(): AppNotification[] {
  return useStore().notifications;
}

export function defaultGroupName(memberIds: string[]) {
  const friends = memberIds.filter((id) => id !== ME).map((id) => getPerson(id).name);
  return friends.length ? `Plan with ${joinNames(friends)}` : "My Plan";
}

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/* ---------- Simulated friends ---------- */

const scheduled = new Set<string>();

/** A friend answers an invite a few seconds after it's sent. */
function scheduleResponses(planId: string) {
  const plan = store.plans[planId];
  if (!plan) return;
  Object.entries(plan.invites).forEach(([friendId, status], i) => {
    const key = `${planId}:${friendId}`;
    if (status !== "invited" || friendId === ME || scheduled.has(key)) return;
    scheduled.add(key);
    setTimeout(
      () => {
        scheduled.delete(key);
        respondToInvite(planId, friendId);
      },
      RESPONSE_DELAY_MS + i * 1200 + (hash(friendId) % 1500),
    );
  });
}

function respondToInvite(planId: string, friendId: string) {
  const plan = store.plans[planId];
  if (!plan || plan.invites[friendId] !== "invited") return;
  const friend = getPerson(friendId);
  const accepts = hash(planId + friendId) % 6 !== 0;
  // Some people accept but skip the budget/distance/timing input.
  const prefs: MemberPrefs | null =
    hash(friendId + planId) % 5 === 0
      ? null
      : { budget: friend.budget ?? 500, distance: friend.distance ?? 10, timeSlot: friend.prefers ?? "Evening" };
  updatePlan(planId, (p) => ({
    ...p,
    invites: { ...p.invites, [friendId]: accepts ? "accepted" : "declined" },
    memberIds: accepts && !p.memberIds.includes(friendId) ? [...p.memberIds, friendId] : p.memberIds,
    memberPrefs: accepts ? { ...p.memberPrefs, [friendId]: prefs } : p.memberPrefs,
    messages: p.created
      ? [...p.messages, system(`${friend.name} ${accepts ? "joined the group" : "declined the invite"}`)]
      : p.messages,
  }));
  const p = store.plans[planId];
  notify({
    kind: "response",
    planId,
    text: `${friend.name} ${accepts ? "accepted" : "declined"} your invite to "${
      p?.groupName || defaultGroupName([...(p?.memberIds ?? []), ...Object.keys(p?.invites ?? {})])
    }"`,
  });
}

/**
 * Groups someone else runs: once everyone has voted, that admin closes voting,
 * then locks the top place and books it (pay at venue), a few seconds apart.
 */
export function advanceSimulatedAdmin(planId: string) {
  const plan = store.plans[planId];
  if (!plan || plan.adminId === ME || plan.archived || plan.locked) return;
  const key = `admin:${planId}:${plan.decided}`;
  if (scheduled.has(key)) return;
  const allVoted = plan.shortlist.every((pid) => plan.memberIds.every((m) => plan.votes[pid]?.[m]));
  if (!plan.decided && !allVoted) return;
  scheduled.add(key);
  setTimeout(() => {
    scheduled.delete(key);
    const p = store.plans[planId];
    if (!p) return;
    const admin = getPerson(p.adminId).name;
    if (!p.decided) {
      const top = rankShortlist(p, getPlace)[0]?.place;
      updatePlan(planId, (q) => ({
        ...q,
        decided: true,
        chosenPlaceId: top?.id ?? null,
        messages: [...q.messages, system(`${admin} closed voting. Comparing the top picks.`)],
      }));
      advanceSimulatedAdmin(planId);
      return;
    }
    const place = getPlace(p.chosenPlaceId);
    if (!place) return;
    const food = place.category === "Food";
    const slots = bookingSlots(p.timeSlot);
    const slot = slots[1] ?? slots[0];
    const amount = place.pricePerPerson * p.memberIds.length + 20;
    updatePlan(planId, (q) => ({
      ...q,
      locked: true,
      booking: food
        ? { ...emptyBooking, status: "walk-in", people: q.memberIds.length, reference: reference("WALKIN") }
        : {
            ...emptyBooking,
            status: "pay-at-venue",
            payMode: "venue",
            method: "cash",
            slot,
            people: q.memberIds.length,
            amount,
            reference: reference("VENUE"),
          },
      messages: [
        ...q.messages,
        system(
          food
            ? `Final pick: ${place.name}. Walk-in, no booking needed.`
            : `${admin} booked ${place.name} (${slot}). Pay ₹${amount} at the venue.`,
        ),
      ],
    }));
  }, 4000);
}

/** Profile defaults for new plans. */
function readProfilePrefs(): Pick<PlanState, "budget" | "distance" | "timeSlot" | "categories"> {
  try {
    const raw = window.localStorage.getItem("planzy:account:v1");
    const prefs = raw ? JSON.parse(raw).account?.profile?.preferences : null;
    if (prefs)
      return { budget: prefs.budget, distance: prefs.distance, timeSlot: prefs.timeSlot, categories: prefs.categories ?? [] };
  } catch {
    // fall through to defaults
  }
  return { budget: 500, distance: 10, timeSlot: "Evening", categories: [] };
}

/* ---------- Actions ---------- */

export const planActions = {
  /** Open a plan (chat, decision and booking screens work on it). */
  select(id: string) {
    ensureLoaded();
    if (store.currentId === id || !store.plans[id]) return;
    setStore((s) => ({ ...s, currentId: id }));
  },

  /** Starts a new plan draft and makes it current. Returns its id. */
  start(flow: PlanFlow, presetMemberIds: string[] = [], placeId?: string) {
    ensureLoaded();
    const id = uid("plan-");
    const prefs = readProfilePrefs();
    const place = placeId ? getPlace(placeId) : undefined;
    const invites = Object.fromEntries(
      presetMemberIds.filter((m) => m !== ME).map((m) => [m, "invited" as const]),
    );
    // Drop earlier drafts that never became a group.
    setStore((s) => {
      const plans = Object.fromEntries(
        Object.entries(s.plans).filter(([, p]) => p.created || p.adminId !== ME),
      );
      plans[id] = newPlan(id, {
        flow,
        invites,
        ...prefs,
        categories: place ? [place.category] : prefs.categories,
        shortlist: place ? [place.id] : [],
      });
      return { ...s, currentId: id, plans };
    });
    return id;
  },

  /** Friends screen: select / unselect someone to invite. */
  toggleInvite(id: string) {
    if (id === ME) return;
    set((s) => {
      const invites = { ...s.invites };
      if (invites[id]) {
        delete invites[id];
        return { ...s, invites, memberIds: s.memberIds.filter((m) => m !== id) };
      }
      invites[id] = "invited";
      return { ...s, invites };
    });
  },

  /** Sends the invites: each friend gets a notification and answers shortly. */
  sendInvites() {
    ensureLoaded();
    if (store.currentId) scheduleResponses(store.currentId);
  },

  /** Group details: admin adds someone to an existing group. */
  addMember(id: string) {
    const plan = current();
    if (plan.invites[id] === "invited" || plan.memberIds.includes(id)) return;
    set((s) => ({
      ...s,
      invites: { ...s.invites, [id]: "invited" },
      messages: s.created
        ? [...s.messages, system(`${getPerson(s.adminId).name} invited ${getPerson(id).name}`)]
        : s.messages,
    }));
    scheduleResponses(plan.id);
  },

  /** Group details: admin removes someone (or cancels their invite). */
  removeMember(id: string) {
    if (id === current().adminId) return;
    set((s) => {
      const invites = { ...s.invites };
      delete invites[id];
      const memberPrefs = { ...s.memberPrefs };
      delete memberPrefs[id];
      const votes = Object.fromEntries(
        Object.entries(s.votes).map(([pid, v]) => {
          const next = { ...v };
          delete next[id];
          return [pid, next];
        }),
      );
      return {
        ...s,
        invites,
        memberPrefs,
        votes,
        memberIds: s.memberIds.filter((m) => m !== id),
        messages: s.created
          ? [...s.messages, system(`${getPerson(s.adminId).name} removed ${getPerson(id).name}`)]
          : s.messages,
      };
    });
  },

  /** You accept an invite, optionally with your budget/distance/timing. */
  acceptInvite(planId: string, prefs: MemberPrefs | null) {
    updatePlan(planId, (p) => ({
      ...p,
      invites: { ...p.invites, [ME]: "accepted" },
      memberIds: p.memberIds.includes(ME) ? p.memberIds : [...p.memberIds, ME],
      memberPrefs: { ...p.memberPrefs, [ME]: prefs },
      messages: [...p.messages, system(`${getPerson(ME).name} joined the group`)],
    }));
    planActions.markInviteHandled(planId);
  },

  declineInvite(planId: string) {
    updatePlan(planId, (p) => ({ ...p, invites: { ...p.invites, [ME]: "declined" } }));
    planActions.markInviteHandled(planId);
  },

  markInviteHandled(planId: string) {
    setStore((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.kind === "invite" && n.planId === planId ? { ...n, read: true } : n,
      ),
    }));
  },

  markNotificationsRead() {
    setStore((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
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
    set((s) => ({ ...s, budget, prefsSkipped: false }));
  },

  setDistance(distance: number) {
    set((s) => ({ ...s, distance, prefsSkipped: false }));
  },

  setTimeSlot(timeSlot: TimeSlot) {
    set((s) => ({ ...s, timeSlot, prefsSkipped: false }));
  },

  setPrefsSkipped(prefsSkipped: boolean) {
    set((s) => ({ ...s, prefsSkipped }));
  },

  setOnlyOpen(onlyOpen: boolean) {
    set((s) => ({ ...s, onlyOpen }));
  },

  setShortlist(shortlist: string[]) {
    set((s) => ({ ...s, shortlist }));
  },

  toggleShortlist(placeId: string) {
    set((s) => ({ ...s, shortlist: toggle(s.shortlist, placeId) }));
  },

  /** Creates the group chat (once) and seeds it with the shortlist. Returns the plan id. */
  openGroupChat() {
    set((s) => {
      if (s.created) return s;
      const groupName = s.groupName.trim() || defaultGroupName([...s.memberIds, ...Object.keys(s.invites)]);
      const joined = s.memberIds.filter((id) => id !== ME);
      const pending = Object.entries(s.invites)
        .filter(([, st]) => st === "invited")
        .map(([id]) => getPerson(id).name);
      const seed: ChatMessage[] = [
        system(`${getPerson(ME).name} created "${groupName}"`),
        ...joined.slice(0, 2).map((id, i) => text(id, greetingLine(hash(id) + i))),
        ...s.shortlist.map((placeId) => placeMsg(ME, placeId)),
        ...(pending.length ? [system(`Waiting for ${joinNames(pending)} to accept`)] : []),
        system("Vote In, Maybe or Can't on each place. The admin taps Decide when ready."),
      ];
      return { ...s, groupName, created: true, createdAt: Date.now(), messages: seed };
    });
    return store.currentId;
  },

  sendMessage(body: string, authorId: string = ME) {
    const trimmed = body.trim();
    if (!trimmed) return;
    const planId = store.currentId;
    set((s) => ({ ...s, messages: [...s.messages, text(authorId, trimmed)] }));
    // Mock: someone else in the group replies shortly after.
    const others = current().memberIds.filter((id) => id !== authorId && id !== ME);
    if (!others.length) return;
    const replier = others[hash(trimmed) % others.length];
    setTimeout(() => {
      updatePlan(planId, (s) => ({ ...s, messages: [...s.messages, text(replier, replyLine(hash(trimmed + replier)))] }));
    }, REPLY_DELAY_MS);
  },

  sendImage(src: string, authorId: string = ME) {
    set((s) => ({ ...s, messages: [...s.messages, { id: uid("m"), kind: "image", authorId, src, at: Date.now() }] }));
  },

  shareLocation(loc: { label: string; lat?: number; lng?: number }, authorId: string = ME) {
    set((s) => ({
      ...s,
      messages: [...s.messages, { id: uid("m"), kind: "location", authorId, ...loc, at: Date.now() }],
    }));
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
    const planId = store.currentId;
    set((s) => {
      if (s.shortlist.includes(placeId)) return s;
      return { ...s, shortlist: [...s.shortlist, placeId], messages: [...s.messages, placeMsg(authorId, placeId)] };
    });
    const others = current().memberIds.filter((id) => id !== authorId && id !== ME);
    if (!others.length) return;
    const replier = others[hash(placeId) % others.length];
    setTimeout(() => {
      updatePlan(planId, (s) => ({
        ...s,
        messages: [...s.messages, text(replier, placeAddedLine(hash(placeId + replier)))],
      }));
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
    set((s) => ({ ...s, decided: false, locked: false, messages: [...s.messages, system("Voting reopened.")] }));
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
        messages: [...s.messages, system(`Booked ${place?.name ?? "the place"} (${s.booking.slot}). You're locked in!`)],
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
          system(`Reserved ${place?.name ?? "the place"} (${s.booking.slot}). Pay ₹${amount} at the venue by ${how}.`),
        ],
      };
    });
  },

  /** Admin deletes the whole plan. */
  deletePlan(id: string) {
    setStore((s) => {
      const plans = { ...s.plans };
      delete plans[id];
      return {
        ...s,
        plans,
        currentId: s.currentId === id ? null : s.currentId,
        notifications: s.notifications.filter((n) => n.planId !== id),
      };
    });
  },

  /** A member leaves a plan; it disappears from their chats. */
  leavePlan(id: string) {
    updatePlan(id, (p) => ({
      ...p,
      memberIds: p.memberIds.filter((m) => m !== ME),
      invites: { ...p.invites, [ME]: "declined" },
      messages: [...p.messages, system(`${getPerson(ME).name} left the group`)],
    }));
    setStore((s) => ({ ...s, currentId: s.currentId === id ? null : s.currentId }));
  },

  toggleFavourite(placeId: string) {
    setStore((s) => ({ ...s, favourites: toggle(s.favourites, placeId) }));
  },

  /** Demo helper: back to the first-run sample data (keeps favourites). */
  reset() {
    setStore((s) => ({ ...seedStore(), favourites: s.favourites }));
  },
};

export const CURRENT_USER_ID = ME;
